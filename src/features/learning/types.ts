export type TocItem = {
  label: string;
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

export type ReferenceTableBlock = ContentBlockBase & {
  type: "reference_table";
  title: string;
  columns: string[];
  note?: string;
};

export type GrammarPointBlock = ContentBlockBase & {
  type: "grammar_point";
  pattern: string;
  section: string;
  explanation: string | null;
  examples: string[];
};

export type GrammarExerciseBlock = ContentBlockBase & {
  type: "grammar_exercise";
  exercise_title: string;
  grammar_ref: string;
  prompt: string;
  example: { given: string[]; dialogue: string[] };
  items: { given: string[] }[];
};

export type Block =
  | LessonTocBlock
  | TextBlock
  | VocabListBlock
  | HintBlock
  | IllustrationBlock
  | ReferenceTableBlock
  | GrammarPointBlock
  | GrammarExerciseBlock;

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
