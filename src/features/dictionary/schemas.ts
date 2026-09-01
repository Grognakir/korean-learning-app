import { z } from "zod";
import { PART_OF_SPEECH_TAGS } from "./types";

// Ограничения длины — не про UI, а про то, что в words/translations
// попадает и ответ LLM, и ручной ввод: без верхней границы в базу
// уезжает что угодно.
export const wordDraftSchema = z.object({
  headword: z.string().min(1, "Введите слово").max(120),
  reading: z.string().max(200).nullable(),
  partOfSpeech: z.enum(PART_OF_SPEECH_TAGS).nullable(),
  translation: z.string().min(1, "Введите перевод").max(500),
  notes: z.string().max(2000).nullable(),
  examples: z
    .array(z.object({ kr: z.string().max(500), ru: z.string().max(500) }))
    .max(20),
  categories: z.array(z.string().min(1).max(80)).max(20),
});

/** Примеры в ответе LLM: раньше просто кастовались, и кривой ответ
 *  всплывал позже невнятной ошибкой схемы уже при сохранении. */
export const llmExamplesSchema = z
  .array(z.object({ kr: z.string().min(1), ru: z.string().min(1) }))
  .min(1);
