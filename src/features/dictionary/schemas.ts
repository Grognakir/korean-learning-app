import { z } from "zod";
import { PART_OF_SPEECH_TAGS } from "./types";

export const wordDraftSchema = z.object({
  headword: z.string().min(1, "Введите слово"),
  reading: z.string().nullable(),
  partOfSpeech: z.enum(PART_OF_SPEECH_TAGS).nullable(),
  translation: z.string().min(1, "Введите перевод"),
  notes: z.string().nullable(),
  examples: z.array(z.object({ kr: z.string(), ru: z.string() })),
  categories: z.array(z.string().min(1)),
});
