import { describe, expect, it } from "vitest";
import { ITEMS } from "@/features/lessonSticker/clothing/items";
import { buildChoices, buildQueue, checkAnswer, deferMistakes, normalizeAnswer } from "@/features/solomonOs/wordTrainer/quiz";
import { TOPICS, wordById } from "@/features/solomonOs/wordTrainer/topics";
import { advanceQuestion, answerWord, chooseMode, chooseTopic, readyThread, startThread } from "@/features/solomonOs/wordTrainer/thread";

const topic = TOPICS[0];
const word = (id: string) => wordById(topic, id);
describe("Словарь и проверка переводов", () => {
  it("содержит все 61 слово из каталога и пять разделов документа", () => {
    expect(topic.words).toHaveLength(61);
    expect(new Set(topic.words.map((w) => w.id)).size).toBe(61);
    expect(topic.words.filter((w) => w.group === "item").map((w) => w.ko)).toEqual(ITEMS.map((i) => i.ko));
    expect(topic.document).toHaveLength(5);
    const rows = (id: string) => topic.document.find((section) => section.id === id)!.groups.flatMap((group) => group.rows);
    expect(rows("colors")).toHaveLength(12);
    expect(rows("clothes")).toHaveLength(35);
    expect(rows("verbs")).toHaveLength(9);
    expect(rows("patterns")).toHaveLength(5);
    expect(rows("examples")).toHaveLength(14);
  });
  it.each([
    ["color:black", " ЧЁРНЫЙ! ", "exact"], ["color:navy", "темно-синий", "exact"],
    ["verb:입다", "  НАДЕВАТЬ   одежду ", "exact"], ["item:dress_shirt", "сорочка", "exact"],
    ["item:hat", "шляпы", "exact"], ["color:blue", "синие", "exact"], ["pattern:plain", "без узора", "exact"],
    ["color:red", "красныи", "typo"], ["color:red", "красн", "wrong"], ["item:coat", "палто", "typo"],
    ["color:red", "синий", "wrong"], ["color:red", "", "wrong"], ["color:blue", "сини", "wrong"],
  ])("%s ← %s: %s", (id, input, expected) => expect(checkAnswer(word(id), input)).toBe(expected));
  it("нормализация сохраняет дефис внутри слова", () => {
    expect(normalizeAnswer('«Тёмно-синий»,  цвет!')).toBe("темно-синий цвет");
    expect(normalizeAnswer("— чёрный —")).toBe("черный");
  });
  it("для каждого слова даёт 4 разных варианта только своей группы", () => {
    for (const entry of topic.words) {
      const choices = buildChoices(topic, entry, () => .3);
      expect(choices).toHaveLength(4);
      expect(new Set(choices).size).toBe(4);
      expect(choices.filter((c) => c === entry.ru)).toHaveLength(1);
      expect(choices.every((ru) => topic.words.some((w) => w.group === entry.group && w.ru === ru))).toBe(true);
    }
  });
  it("начальная очередь содержит все слова по разу", () => {
    const queue = buildQueue(topic, () => .2);
    expect(queue).toHaveLength(61);
    expect(new Set(queue).size).toBe(61);
  });
  it("перемешивает только ошибки в хвосте, не трогая новые слова", () => {
    const pending = ["new-a", "bad-a", "new-b", "bad-b"];
    expect(deferMistakes(pending, ["bad-a", "bad-b", "current"], "current", () => 0)).toEqual(["new-a", "new-b", "bad-b", "current", "bad-a"]);
    const retry = deferMistakes(["bad-a", "bad-b"], ["bad-a", "bad-b", "current"], "current", () => .99);
    expect(retry[0]).not.toBe("current");
    expect(new Set(retry).size).toBe(3);
  });
  it("не спрашивает верные слова снова, возвращает только ошибки, предлагает завершение после их исправления", () => {
    let thread = chooseMode(readyThread(chooseTopic(startThread(1), topic.id, 2), 3), "typing", 4);
    const missed = thread.queue.slice(0, 2);
    const asked: string[] = [];
    for (let i = 0; i < 61; i++) {
      const id = thread.queue[thread.position];
      asked.push(id);
      thread = answerWord(thread, i < 2 ? "не знаю" : word(id).ru, 5 + i * 2);
      expect(answerWord(thread, "повторное нажатие", 5 + i * 2)).toBe(thread);
      thread = advanceQuestion(thread, 6 + i * 2);
    }
    expect(new Set(asked).size).toBe(61);
    expect(thread.correct).toBe(59);
    expect(thread.answered).toBe(61);
    expect(new Set(thread.queue.slice(thread.position))).toEqual(new Set(missed));
    while (thread.phase === "quiz") {
      const id = thread.queue[thread.position];
      expect(missed).toContain(id);
      thread = advanceQuestion(answerWord(thread, word(id).ru, 200), 201);
    }
    expect(thread.phase).toBe("completed");
    expect(thread.learned).toHaveLength(61);
    expect(thread.answered).toBe(63);
    expect(thread.log.at(-1)?.ru).toBe("Молодец! Верно 61 из 63.");
  });
});
