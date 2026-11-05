import type { WordTopic } from "../wordTrainer/topics";
import { koreanVariants, russianVariants, trainableWords, type DictionaryData } from "./entries";

export function dictionaryTopic(data: DictionaryData): WordTopic {
  const words = [...trainableWords(data)].sort((a, b) => a.createdAt - b.createdAt).map((entry) => ({
    id: entry.id, group: "personal" as const, ko: koreanVariants(entry.ko)[0], ru: russianVariants(entry.ru)[0], accept: russianVariants(entry.ru),
  }));
  return { id: "personal", titleKo: "내 단어장", titleRu: "Мой словарь", words,
    document: [{ id: "words", titleKo: "단어", titleRu: "Слова", groups: [{ id: "words", rows: words.map(({ id, ko, ru }) => ({ id, ko, ru })) }] }] };
}
