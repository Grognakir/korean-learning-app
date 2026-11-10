import { StrictMode } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { expect, it } from "vitest";
import { PageBlocks } from "@/features/learning/components/blocks/PageBlocks";
import { highlightDialogueSpeakers, vocabKeysInText } from "@/features/learning/components/blocks/vocabHighlight";
import type { Block } from "@/features/learning/types";

it("показывает перевод слова только при первом употреблении в разделе", () => {
  const blocks: Block[] = [
    {
      id: "vocab",
      type: "vocab_list",
      title: "단어",
      related_text_ref: "dialogue",
      items: [{ ko: "개월", translation_ru: "месяц" }],
    },
    {
      id: "dialogue",
      type: "text",
      text_kind: "dialogue",
      lines: [{ text: "3개월이 됐어요." }, { text: "4개월이 지났어요." }],
    },
    {
      id: "grammar",
      type: "grammar_point",
      pattern: "AV-(으)ㄴ 지",
      section: "1",
      explanation: null,
      examples: ["6개월이 됐어요."],
    },
    {
      id: "exercise",
      type: "grammar_exercise",
      exercise_title: "연습하기",
      grammar_ref: "grammar",
      prompt: "말해 보세요.",
      example: { given: ["9개월"], dialogue: ["9개월이 됐어요."] },
      template: ["{0}이 됐어요."],
      items: [{ given: ["12개월"], answers: ["12개월"] }],
    },
  ];

  const { container } = render(<PageBlocks blocks={blocks} />);
  expect(container.querySelectorAll('[class*="inlineVocab"]')).toHaveLength(1);
});

it("подключает локальный словарь к примеру конкретного упражнения", () => {
  const blocks: Block[] = [
    {
      id: "exercise",
      type: "grammar_exercise",
      exercise_title: "연습하기",
      grammar_ref: "grammar",
      prompt: "말해 보세요.",
      example: {
        given: ["목소리"],
        dialogue: ["목소리가 작아요."],
        vocab: [{ ko: "목소리", translation_ru: "голос" }],
      },
      template: ["{0}가 작아요."],
      items: [{ given: ["소리"], answers: ["소리"] }],
    },
  ];

  const { container } = render(<PageBlocks blocks={blocks} />);
  expect(container.querySelector('[class*="inlineVocab"]')?.textContent).toBe("목소리голос");
});

it("добавляет словарик упражнения к словам страницы, не перебивая их", () => {
  const blocks: Block[] = [
    {
      id: "vocab",
      type: "vocab_list",
      title: "단어",
      items: [{ ko: "목소리", translation_ru: "голос (страница)" }],
    },
    {
      id: "exercise",
      type: "grammar_exercise",
      exercise_title: "연습하기",
      grammar_ref: "grammar",
      prompt: "말해 보세요.",
      vocab: [
        { ko: "목소리", translation_ru: "голос (упражнение)" },
        { ko: "작다", translation_ru: "быть тихим" },
      ],
      example: { given: ["목소리"], dialogue: ["목소리가 작아요."] },
      template: ["{0}가 작아요."],
      items: [{ given: ["소리"], answers: ["소리"] }],
    },
  ];

  const { container } = render(<PageBlocks blocks={blocks} />);
  const text = container.textContent ?? "";
  expect(text).toContain("голос (страница)");
  expect(text).not.toContain("голос (упражнение)");
  expect(text).toContain("быть тихим");
});

it("подсвечивает слова страницы и словарик в задании на аудирование", () => {
  const blocks: Block[] = [
    {
      id: "vocab",
      type: "vocab_list",
      title: "단어",
      related_text_ref: "listening",
      items: [
        { ko: "거절하다", translation_ru: "отказывать(ся)" },
        { ko: "참다", translation_ru: "терпеть" },
      ],
    },
    {
      id: "listening",
      type: "comprehension_exercise",
      exercise_kind: "listening",
      title: "듣기",
      transcript: {
        lines: [{ speaker: "흐엉", text: "제 성격이 싫어요." }],
        vocab: [{ ko: "성격", translation_ru: "характер" }],
      },
      questions: [
        {
          kind: "choice",
          prompt: "같은 것을 고르십시오.",
          choices: ["거절을 못하고 참고 기다립니다."],
          correct: 0,
        },
      ],
    },
  ];

  const { container } = render(
    <StrictMode>
      <PageBlocks blocks={blocks} />
    </StrictMode>,
  );
  const tips = Array.from(container.querySelectorAll('[role="tooltip"]')).map((el) => el.textContent);
  expect(tips).toContain("характер");
  expect(tips).toContain("терпеть");
  expect(tips).toContain("отказывать(ся)");
  expect(container.querySelectorAll("button button")).toHaveLength(0);
});

it("показывает hint с фразами внутри задания на аудирование", () => {
  const blocks: Block[] = [
    {
      id: "hint-listening",
      type: "hint",
      hint_kind: "expression",
      related_text_ref: "listening",
      label_ko: "내 표현",
      label_ru: "Мои выражения",
      items: [{ kind: "phrase", text: "말을 잘 못해요", translation_ru: "не могу сказать" }],
    },
    {
      id: "listening",
      type: "comprehension_exercise",
      exercise_kind: "listening",
      title: "듣기",
      transcript: { lines: [{ speaker: "흐엉", text: "고민이 있어요." }] },
      questions: [{ kind: "open", prompt: "무슨 이야기를 합니까?" }],
    },
  ];

  const { container } = render(<PageBlocks blocks={blocks} />);
  expect(container.querySelector("details")?.textContent).toContain("말을 잘 못해요");
  expect(container.textContent).toContain("내 표현");
  expect(container.textContent).toContain("말을 잘 못해요");
  expect(container.textContent?.match(/말을 잘 못해요/g)).toHaveLength(1);
});

it("даёт поле ввода под открытым вопросом и держит значок перевода рядом с итоговым заданием", () => {
  const blocks: Block[] = [
    {
      id: "listening",
      type: "comprehension_exercise",
      exercise_kind: "listening",
      title: "듣기",
      group_prompt: "다음을 듣고 물음에 답하십시오.",
      questions: [
        { kind: "open", prompt: "무슨 이야기를 합니까?" },
        { kind: "choice", prompt: "같은 것을 고르십시오.", choices: ["가", "나"], correct: 0 },
      ],
      followup: "이야기해 보십시오.",
      followup_ru: "Расскажите.",
    },
  ];

  const { container, getByLabelText } = render(<PageBlocks blocks={blocks} />);
  const input = getByLabelText("무슨 이야기를 합니까?") as HTMLInputElement;
  fireEvent.change(input, { target: { value: "고민" } });
  expect(input.value).toBe("고민");
  const followup = container.querySelector('[class*="comprehensionFollowup"]');
  expect(followup?.children).toHaveLength(1);
  expect(followup?.firstElementChild?.textContent).toContain("이야기해 보십시오.");
  expect(container.querySelector('[class*="comprehensionSubItems"]')).not.toBeNull();
});

it("ставит заголовок статьи и строку-справку в одну строку", () => {
  const blocks: Block[] = [
    {
      id: "article",
      type: "text",
      text_kind: "article",
      lines: [
        { text: "제 고민을 들어 주세요.", line_kind: "heading" },
        { text: "ID : inha 0817", line_kind: "meta" },
        { text: "본문입니다." },
      ],
    },
  ];

  const { container } = render(<PageBlocks blocks={blocks} />);
  const row = container.querySelector('[class*="articleTitleRow"]');
  expect(row?.children).toHaveLength(2);
  expect(row?.textContent).toContain("ID : inha 0817");
  expect(container.querySelectorAll('[class*="articleParagraph"]')).toHaveLength(1);
});

it("подсвечивает основные и дополнительные слова раздела в любом тексте, один раз", () => {
  const blocks: Block[] = [
    {
      id: "vocab",
      type: "vocab_list",
      title: "단어",
      items: [{ ko: "회사", translation_ru: "компания" }],
      extra_words: { topic_vocab: [{ ko: "직업", translation_ru: "профессия" }] },
    },
    {
      id: "text",
      type: "text",
      text_kind: "passage",
      lines: [{ text: "저는 직업이 회사원입니다." }, { text: "회사에 갑니다. 직업은 좋습니다." }],
    },
  ];

  const { container } = render(<PageBlocks blocks={blocks} />);
  const tips = Array.from(container.querySelectorAll('[class*="inlineVocab"] [role="tooltip"]')).map(
    (el) => el.textContent,
  );
  expect(tips).toEqual(["профессия", "компания"]);
});

it("подсвечивает слова из extra_words в тексте раздела", () => {
  const blocks: Block[] = [
    {
      id: "vocab",
      type: "vocab_list",
      title: "단어",
      items: [{ ko: "회사", translation_ru: "компания" }],
      extra_words: {
        text_vocab: [{ ko: "직업", translation_ru: "профессия" }],
        grammar_vocab: [{ ko: "행복하다", translation_ru: "быть счастливым" }],
      },
    },
    {
      id: "text",
      type: "text",
      text_kind: "passage",
      lines: [{ text: "직업이 행복합니다." }],
    },
  ];

  const { container } = render(<PageBlocks blocks={blocks} />);
  const tips = Array.from(container.querySelectorAll('[class*="inlineVocab"] [role="tooltip"]')).map(
    (el) => el.textContent,
  );
  expect(tips).toEqual(["профессия", "быть счастливым"]);
});

it("переводит слово в задании на аудирование один раз: в тексте, а не в ответах", () => {
  const blocks: Block[] = [
    {
      id: "vocab",
      type: "vocab_list",
      title: "단어",
      items: [{ ko: "자신", translation_ru: "сам, собственный" }],
    },
    {
      id: "listening",
      type: "comprehension_exercise",
      exercise_kind: "listening",
      title: "듣기",
      transcript: { lines: [{ speaker: "흐엉", text: "제 자신이 싫어요." }] },
      questions: [
        {
          kind: "choice",
          prompt: "같은 것을 고르십시오.",
          choices: ["자신의 성격 때문에 고민합니다."],
          correct: 0,
        },
      ],
    },
  ];

  const { container } = render(<PageBlocks blocks={blocks} />);
  const chips = container.querySelectorAll('[class*="inlineVocab"]');
  expect(chips).toHaveLength(1);
  expect(container.querySelector("details")?.contains(chips[0])).toBe(true);
});

it("находит словарные формы в реальных примерах упражнений", () => {
  expect(
    vocabKeysInText("목소리가 너무 작으니까 크게 이야기하세요.", [
      { ko: "목소리", translation_ru: "голос" },
      { ko: "너무", translation_ru: "слишком, очень" },
      { ko: "작다", translation_ru: "быть тихим, маленьким" },
      { ko: "크다", translation_ru: "быть громким, большим" },
    ]),
  ).toEqual(["목소리", "너무", "작다", "크다"]);

  expect(
    vocabKeysInText("머리를 어떻게 자를 거예요?", [
      { ko: "머리", translation_ru: "голова, волосы" },
      { ko: "자르다", translation_ru: "стричь, резать" },
      { ko: "자를", translation_ru: "стричь, резать (форма от 자르다)" },
    ]),
  ).toEqual(["머리", "자를"]);
});

// Регресс: "자를" — вокаб-слово, которое начинается ДО emphasis-диапазона
// "를 거예요" и заканчивается ВНУТРИ него. Раньше текст резался по границам
// emphasis раньше вокаб-поиска, поэтому "자를" не находился целиком (только
// изолированный "자" оставался без перевода). Слово должно рендериться
// ОДНИМ чипом, а не распадаться на "자" (обычный текст) + "를" (внутри
// отдельного emphasis-span).
it("вокаб-слово, пересекающее границу emphasis, остаётся одним чипом", () => {
  const { container } = render(
    <>
      {highlightDialogueSpeakers(
        "머리를 어떻게 자를 거예요?",
        [{ ko: "자를", translation_ru: "стричь, резать (форма от 자르다)" }],
        "",
        undefined,
        ["를 어떻게", "를 거예요"],
      )}
    </>,
  );

  const chips = container.querySelectorAll('[class*="inlineVocab"]');
  expect(chips).toHaveLength(1);
  expect(chips[0].querySelector('[class*="vocabKo"]')?.textContent).toBe("자를");
  // Внутри чипа "를" должен всё равно нести emphasis-стиль.
  expect(chips[0].querySelector('[class*="exerciseEmphasis"]')?.textContent).toBe("를");
});

// Регресс: слово-подсказка внутри пункта-кнопки упражнения (`exerciseItem`)
// не должно рендериться как вложенный <button> (невалидный HTML) и тап по
// нему не должен всплывать до кнопки-родителя — иначе на мобильных нельзя
// посмотреть перевод, не выбрав/не запустив упражнение.
it("вокаб-чип внутри кликабельного родителя не триггерит его onClick", () => {
  const onParentClick = () => {
    parentClicked = true;
  };
  let parentClicked = false;

  const { container } = render(
    <button type="button" onClick={onParentClick}>
      {highlightDialogueSpeakers(
        "짧은 머리",
        [{ ko: "머리", translation_ru: "голова, волосы" }],
        "",
        undefined,
        [],
        undefined,
        true,
      )}
    </button>,
  );

  const chipControl = container.querySelector('[class*="vocabKo"]');
  expect(chipControl?.tagName).toBe("SPAN");
  expect(chipControl?.getAttribute("role")).toBe("button");
  expect(container.querySelector("button > button")).toBeNull();

  fireEvent.click(chipControl!);
  expect(parentClicked).toBe(false);
});

it("однослоговое слово совпадает только с начала слова", () => {
  const items = [{ ko: "화", translation_ru: "гнев" }];
  expect(vocabKeysInText("그 영화를 봤어요.", items)).toEqual([]);
  expect(vocabKeysInText("운동화를 샀어요.", items)).toEqual([]);
  expect(vocabKeysInText("화가 났어요.", items)).toEqual(["화"]);
});

it("чип покрывает основу и вросший слог, но не отдельные окончания и частицы", () => {
  const items = [
    { ko: "반갑다", translation_ru: "рад" },
    { ko: "환영", translation_ru: "приветствие" },
    { ko: "쇼핑몰", translation_ru: "магазин" },
    { ko: "오다", translation_ru: "приходить" },
    { ko: "가다", translation_ru: "идти" },
    { ko: "걱정되", translation_ru: "форма от 걱정되다 (тревожиться)" },
    { ko: "잘하", translation_ru: "форма от 잘하다 (хорошо делать)" },
    { ko: "어렸", translation_ru: "форма от 어리다 (быть молодым)" },
    { ko: "축구할", translation_ru: "форма от 축구하다 (играть в футбол)" },
  ];
  const chipText = (text: string) => {
    const { container } = render(<div>{highlightDialogueSpeakers(text, items)}</div>);
    const chip = container.querySelector('[class*="vocabKo"]');
    cleanup();
    return chip?.textContent ?? null;
  };
  expect(chipText("만나서 반갑습니다.")).toBe("반갑");
  expect(chipText("모두 환영합니다.")).toBe("환영합");
  expect(chipText("쇼핑몰을 알아요?")).toBe("쇼핑몰");
  expect(chipText("조금 걱정되네요.")).toBe("걱정되");
  expect(chipText("오위노 씨는요?")).toBeNull();
  expect(chipText("오면 전화하세요.")).toBe("오");
  expect(chipText("학교에 가요.")).toBe("가");
  expect(chipText("달리기를 잘하는 편이었어요.")).toBe("잘하");
  expect(chipText("어렸을 때는 달리기를 했어요.")).toBe("어렸");
  expect(chipText("친구들과 축구할 거예요.")).toBe("축구할");
});

it("односложное существительное не совпадает с началом другого слова", () => {
  const items = [{ ko: "이", translation_ru: "зуб" }, { ko: "눈", translation_ru: "глаз" }];
  expect(vocabKeysInText("이번 방학에 가요.", items)).toEqual([]);
  expect(vocabKeysInText("눈썰매를 타요.", items)).toEqual([]);
  expect(vocabKeysInText("이를 닦습니다.", items)).toEqual(["이"]);
  expect(vocabKeysInText("눈이 커요.", items)).toEqual(["눈"]);
  expect(vocabKeysInText("눈", items)).toEqual(["눈"]);
});

it("односложное существительное не совпадает с началом слова вроде 도서관", () => {
  const items = [{ ko: "도", translation_ru: "градус" }];
  expect(vocabKeysInText("도서관에서 공부해요.", items)).toEqual([]);
  expect(vocabKeysInText("도가 높아요.", items)).toEqual(["도"]);
});

it("наречие «다» совпадает только как отдельное слово", () => {
  const items = [{ ko: "다", translation_ru: "всё" }];
  expect(vocabKeysInText("숙제를 다 했어요.", items)).toEqual(["다"]);
  expect(vocabKeysInText("다음 주에 다시 와요.", items)).toEqual([]);
  expect(vocabKeysInText("다치다", items)).toEqual([]);
});

it("основа 건너다 не совпадает внутри 건너편", () => {
  const items = [{ ko: "건너다", translation_ru: "переходить" }];
  expect(vocabKeysInText("길 건너편에서 타세요.", items)).toEqual([]);
  expect(vocabKeysInText("횡단보도를 건너면 우체국이 있어요.", items)).toEqual(["건너다"]);
});

