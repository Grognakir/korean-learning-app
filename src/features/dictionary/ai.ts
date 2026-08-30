import "server-only";
import type { PartOfSpeech, WordDraft } from "./types";
import { PART_OF_SPEECH_TAGS } from "./types";

function buildSystemPrompt(categories: string[]) {
  return `Ты помощник, который составляет карточки корейских слов для учебного словаря.
На вход получаешь слово (на корейском или по-русски). Существующие категории:
${categories.map((c) => `- ${c}`).join("\n")}

Сначала попробуй отнести слово к ОДНОЙ из категорий выше — название должно совпадать ДОСЛОВНО.
Если ни одна не подходит, придумай новую короткую категорию в том же стиле — тогда "newCategory": true.

Часть речи — строго одно значение из списка: ${PART_OF_SPEECH_TAGS.join(", ")}. Если не уверен — null.

Ответь СТРОГО валидным JSON, без markdown, без пояснений:
{"category": "...", "newCategory": true|false, "partOfSpeech": "..."|null,
 "kr": "слово на корейском в словарной форме (если во входе опечатка или неправильная форма, но по контексту понятно, что имелось в виду — верни исправленное правильное слово)",
 "reading": "упрощённая транслитерация латиницей", "translation": "перевод на русский, кратко",
 "notes": "короткая заметка или пустая строка",
 "examples": [{"kr": "пример-предложение", "ru": "перевод примера"}]}
В examples — минимум один пример уровня TOPIK I.`;
}

async function callGemini(system: string, user: string): Promise<string> {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini HTTP ${res.status}`);
  const json = await res.json();
  return json.candidates[0].content.parts[0].text;
}

async function callGroq(system: string, user: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`groq HTTP ${res.status}`);
  const json = await res.json();
  return json.choices[0].message.content;
}

async function callOpenRouter(system: string, user: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemma-3-27b-it:free",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openrouter HTTP ${res.status}`);
  const json = await res.json();
  return json.choices[0].message.content;
}

const PROVIDERS: { key: string; call: typeof callGemini }[] = [
  { key: "GEMINI_API_KEY", call: callGemini },
  { key: "GROQ_API_KEY", call: callGroq },
  { key: "OPENROUTER_API_KEY", call: callOpenRouter },
];

function parseDraft(text: string, input: string): WordDraft {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("LLM вернула не JSON");
  const obj = JSON.parse(match[0]) as Record<string, unknown>;
  if (!obj.kr || !obj.translation || !obj.category) {
    throw new Error("В ответе не хватает полей");
  }
  if (!Array.isArray(obj.examples) || obj.examples.length === 0) {
    throw new Error("Нет примеров");
  }
  const rawPos = obj.partOfSpeech as string | null | undefined;
  const partOfSpeech = PART_OF_SPEECH_TAGS.includes(rawPos as PartOfSpeech)
    ? (rawPos as PartOfSpeech)
    : null;
  const draft: WordDraft = {
    headword: String(obj.kr),
    reading: obj.reading ? String(obj.reading) : null,
    partOfSpeech,
    translation: String(obj.translation),
    notes: obj.notes ? String(obj.notes) : null,
    examples: obj.examples as { kr: string; ru: string }[],
    categories: [String(obj.category)],
    isNewCategory: Boolean(obj.newCategory),
  };
  if (/[가-힣]/.test(input) && input !== obj.kr) {
    draft.correctedFrom = input;
  }
  return draft;
}

export async function generateWordDraft(
  input: string,
  categories: string[],
): Promise<WordDraft> {
  const available = PROVIDERS.filter((p) => process.env[p.key]);
  if (available.length === 0) {
    throw new Error(
      "AI недоступен — не настроен ни один провайдер (GEMINI_API_KEY/GROQ_API_KEY/OPENROUTER_API_KEY)",
    );
  }
  const system = buildSystemPrompt(categories);
  const user = `Слово или значение: ${input}`;
  let lastError: Error | null = null;
  for (const provider of available) {
    try {
      const text = await provider.call(system, user);
      return parseDraft(text, input);
    } catch (e) {
      lastError = e as Error;
    }
  }
  throw new Error(`Все провайдеры недоступны: ${lastError?.message}`);
}
