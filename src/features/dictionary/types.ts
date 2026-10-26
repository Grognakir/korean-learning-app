export const PART_OF_SPEECH_TAGS = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "numeral",
  "counter",
  "particle",
  "preposition",
  "conjunction",
  "connective_ending",
  "question_word",
  "determiner",
  "interjection",
] as const;

export type PartOfSpeech = (typeof PART_OF_SPEECH_TAGS)[number];

export type WordDraft = {
  headword: string;
  reading: string | null;
  partOfSpeech: PartOfSpeech | null;
  translation: string;
  notes: string | null;
  examples: { kr: string; ru: string }[];
  categories: string[];
  correctedFrom?: string;
  isNewCategory?: boolean;
};

export type GrammarNoteBlock =
  | { type: "text"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "examples"; items: { kr: string; ru: string }[] };

/** section: true — раздел с подписью («КАК ОБРАЗУЕТСЯ») между правилами и
 * примерами; иначе сноска с заголовком после примеров. */
export type GrammarNote = { title: string; blocks: GrammarNoteBlock[]; section?: boolean };

export type GrammarPoint = {
  id: string;
  pattern: string;
  short_desc: string | null;
  category: string;
  grammar_group: string | null;
  lesson_label: string | null;
  lessons: number[] | null;
  explanation: string | null;
  usage: string[] | null;
  rules: string[] | null;
  examples: { kr: string; ru: string }[];
  vocab: { kr: string; ru: string }[] | null;
  notes: GrammarNote[] | null;
  owner_user_id: string | null;
};

export type Phrase = {
  id: string;
  phrase_kr: string;
  reading: string | null;
  translation: string;
  usage_note: string | null;
  category: string | null;
  owner_user_id: string | null;
};

export type Word = {
  id: string;
  headword: string;
  reading: string | null;
  part_of_speech: string | null;
  owner_user_id: string | null;
  translations: { text: string }[];
  word_categories: { categories: { id: string; name: string } }[];
  word_examples: { kr: string; ru: string }[];
  word_notes: { text: string }[];
  word_forms: { label: string | null; value: string }[];
};

export type CategoryOption = {
  id: string;
  name: string;
};
