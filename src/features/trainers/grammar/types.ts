export type GrammarExample = { kr: string; ru: string };

export type GrammarDrill = { base_kr: string; base_ru: string; task_ru: string; answers: string[] };
export type GrammarMatchPair = { kr: string; ru: string };
export type GrammarCloze = { kr_before: string; kr_after: string; ru: string; options: string[]; correct: number };
export type GrammarReply = { prompt_kr: string; prompt_ru: string; options: string[]; correct: number };
export type GrammarBlitzItem = { kr: string; ru: string };

export type GrammarExercises = {
  drills: GrammarDrill[];
  match: GrammarMatchPair[];
  cloze: GrammarCloze[];
  reply: GrammarReply[];
  blitz: GrammarBlitzItem[];
};

export type GrammarTheory = {
  id: string;
  pattern: string;
  meaning: string | null;
  category: string;
  explanation: string | null;
  rules: string[];
  usage: string[];
};

export type TrainerGrammar = GrammarTheory & GrammarExercises & { examples: GrammarExample[] };

export type GrammarArea = { key: string; label: string; count: number };

export type StudyItem = GrammarTheory & { examples: GrammarExample[]; quiz: GrammarDrill[] };

export type PracticeTask =
  | { type: "drill"; pattern: string; item: GrammarDrill }
  | { type: "cloze"; pattern: string; item: GrammarCloze }
  | { type: "reply"; pattern: string; item: GrammarReply }
  // ru — переводы тех же пар в своём порядке: колонки перемешаны при сборке
  // на сервере, чтобы клиентский рендер совпадал с серверным.
  | { type: "match"; pairs: (GrammarMatchPair & { pattern: string })[]; ru: string[] };

export type BlitzQuestion = {
  dir: "kr" | "ru";
  pattern: string;
  prompt: string;
  answer: string;
  options: string[];
};

export type GrammarSessionData = {
  id: string;
  study: StudyItem[];
  tasks: PracticeTask[];
  blitz: BlitzQuestion[];
};

// koreanAnswer: ответ (и введённое) по-корейски, а вопрос — по-русски;
// false только у блица «корейская форма → значение».
export type Mistake = { pattern: string; question: string; answer: string; yours: string; koreanAnswer: boolean };

export type StageScore = { correct: number; total: number };
