export const PART_OF_SPEECH_TAGS = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "numeral",
  "counter",
  "particle",
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
