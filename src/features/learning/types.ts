export type TocItem = {
  label: string;
  label_ru?: string;
  block_ref: string | null;
};

export type LessonTocBlock = {
  type: "lesson_toc";
  sections: { key: string; items: TocItem[] }[];
};

/**
 * Общие поля любого блока, кроме lesson_toc — id (стабильный якорь блока
 * в пределах урока, на него ссылается TocItem.block_ref и якорь-скролл
 * страницы раздела) и toc_section (какому key из lesson_toc.sections
 * принадлежит блок). См. docs/dev_docs/4-textbook-content-authoring.md.
 */
type ContentBlockBase = {
  id?: string;
  toc_section?: string;
};

export type TextLine = {
  speaker?: string;
  text: string;
  emphasized?: string[];
};

export type TextBlockIllustration = {
  storage_path: string | null;
  original_kind: "photo" | "illustration";
  imageUrl?: string | null;
};

/**
 * title/illustration — картинка и подпись-заголовок диалога встроены прямо
 * в text-блок (а не отдельным illustration-блоком рядом), чтобы заголовок,
 * картинка (без caption), аудио и текст рендерились одной единой карточкой.
 * Отдельный тип IllustrationBlock по-прежнему существует для иллюстраций,
 * не привязанных к конкретному тексту (например пары illustration+hint).
 */
export type TextBlock = ContentBlockBase & {
  type: "text";
  title?: string;
  title_ru?: string;
  illustration?: TextBlockIllustration | null;
  text_kind: "dialogue" | "passage" | "example_line";
  section?: string | null;
  exercise_ref?: string | null;
  audio_id?: string | null;
  speakers?: string[];
  lines: TextLine[];
  audioUrl?: string | null;
};

export type VocabListBlock = ContentBlockBase & {
  type: "vocab_list";
  title: string;
  title_ru?: string;
  related_text_ref?: string | null;
  source_note?: string;
  items: { ko: string; translation_ru: string }[];
};

export type HintItem = {
  text: string;
  translation_ru: string;
  /**
   * phrase — готовое выражение, можно использовать как есть.
   * pattern — конструкция с плейсхолдером (например "N에서 왔습니다"),
   * даже если внутри есть готовый пример через двоеточие.
   */
  kind: "phrase" | "pattern";
};

export type HintBlock = ContentBlockBase & {
  type: "hint";
  hint_kind: string;
  related_text_ref?: string | null;
  pair_id?: string | null;
  items: HintItem[];
};

export type IllustrationBlock = ContentBlockBase & {
  type: "illustration";
  storage_path: string | null;
  caption: string;
  original_kind: "photo" | "illustration";
  pair_id?: string | null;
  imageUrl?: string | null;
};

export type PhraseGalleryItem = {
  storage_path: string | null;
  caption: string;
  phrases: { text: string; translation_ru: string }[];
  imageUrl?: string | null;
};

/**
 * Объединяет то, что раньше было парами illustration+hint (одна картинка —
 * одна/несколько готовых фраз) в одну карточку сетки, а не два отдельных
 * блока подряд — см. историю правок 1 урока (準備하기 1, прощание/спасибо/
 * извинение и т.п.).
 */
export type PhraseGalleryBlock = ContentBlockBase & {
  type: "phrase_gallery";
  title?: string;
  title_ru?: string;
  items: PhraseGalleryItem[];
};

export type ReferenceTableBlock = ContentBlockBase & {
  type: "reference_table";
  title: string;
  title_ru?: string;
  columns: string[];
  translations?: string[];
  flags?: (string | null)[];
  flagUrls?: (string | null)[];
  note?: string;
};

/**
 * Один вопрос упражнения на понимание (после аудио в 듣고 말하기 или после
 * текста в 읽고 말하기). "choice" — вопрос с вариантами: correct задан,
 * только если в оригинале виден отмеченный правильный ответ (обычно у
 * 읽고 말하기 — печатный текст перед глазами, отметка ручкой студента и
 * так была видна); для 듣고 말하기 правильный ответ обычно не виден без
 * текста аудио (он в 듣기 지문 в конце книги, не сфотографирован) —
 * тогда correct: null, вопрос показывается как есть, без проверки.
 */
export type ComprehensionQuestion = {
  prompt: string;
  kind: "open" | "table" | "choice";
  table?: { columns: string[]; rows: string[] };
  choices?: string[];
  correct?: number | null;
};

export type ComprehensionExerciseBlock = ContentBlockBase & {
  type: "comprehension_exercise";
  exercise_kind: "listening" | "reading";
  title: string;
  audio_id?: string | null;
  audioUrl?: string | null;
  /** "1." — иллюстрация-затравка с вопросом перед самим упражнением. */
  warmup?: {
    prompt: string;
    illustration?: TextBlockIllustration | null;
  } | null;
  /** "2." — вступление к вопросам («다음을 듣고/읽고 물음에 답하십시오»), показывается перед questions[]. */
  group_prompt?: string | null;
  questions: ComprehensionQuestion[];
  /** "3." — итоговое задание на собственную речь (без проверки). */
  followup?: string | null;
};

/**
 * Раздел 쓰기 — план (개요: этапы текста + наводящие вопросы к каждому) и
 * общая инструкция; само поле для письма в приложении не нужно (это не
 * конспект-редактор), план — справочная структура для собственной работы
 * студента в тетради/учебнике.
 */
export type WritingExerciseBlock = ContentBlockBase & {
  type: "writing_exercise";
  title: string;
  prompt: string;
  outline: {
    stage: string;
    explanation: string;
    questions: { kr: string; ru: string }[];
  }[];
};

/** Раздел 발음 — правило чтения (например 구개음화) и слова-примеры. */
export type PronunciationBlock = ContentBlockBase & {
  type: "pronunciation";
  rule: string;
  audio_id: string | null;
  audioUrl?: string | null;
  examples: string[];
};

export type GrammarPointBlock = ContentBlockBase & {
  type: "grammar_point";
  pattern: string;
  section: string;
  explanation: string | null;
  rules?: string[];
  examples: string[];
};

export type GrammarExerciseBlock = ContentBlockBase & {
  type: "grammar_exercise";
  exercise_title: string;
  grammar_ref: string;
  prompt: string;
  // Пример — уже готовая фраза без пропусков, для чтения.
  example: {
    given: string[];
    cues?: string[];
    dialogue: string[];
    emphasis?: string[][];
  };
  // Те же строки, что и example.dialogue, но со вставками {0},{1}... на
  // месте пропусков — явный шаблон вместо угадывания места пропуска
  // поиском словарной формы по проспрягованному тексту.
  template: string[];
  // answers — реальные проспрягованные формы (по одной на каждый {n} в
  // template), а не словарная форма given.
  items: { given: string[]; cues?: string[]; answers: string[] }[];
};

export type Block =
  | LessonTocBlock
  | TextBlock
  | VocabListBlock
  | HintBlock
  | IllustrationBlock
  | ReferenceTableBlock
  | PhraseGalleryBlock
  | GrammarPointBlock
  | GrammarExerciseBlock
  | ComprehensionExerciseBlock
  | WritingExerciseBlock
  | PronunciationBlock;

export type PageContent = {
  page_role: string;
  source_photo: string;
  blocks: Block[];
};

export type TextbookPageRow = {
  id: string;
  page_index: number;
  page_number: number | null;
  lesson_number: number | null;
  content: PageContent;
};
