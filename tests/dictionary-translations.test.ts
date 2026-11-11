import { describe, expect, it } from "vitest";
import {
  applyDictionaryTranslations,
  collectVocabKeys,
  joinDictionaryTranslations,
} from "@/features/learning/dictionaryTranslations";

describe("переводы слов уроков из словаря", () => {
  const blocks = [
    {
      type: "vocab_list",
      items: [
        { ko: "일", translation_ru: "день, число" },
        { ko: "예뻤어요", translation_ru: "форма от 예쁘다" },
      ],
      extra_words: { text_vocab: [{ ko: "끼다", translation_ru: "надевать" }] },
    },
    { type: "text", lines: [{ text: "네", translation_ru: "Да" }] },
  ];

  it("собирает только слова { ko, translation_ru }", () => {
    expect([...collectVocabKeys(blocks)].sort()).toEqual(["끼다", "예뻤어요", "일"].sort());
  });

  it("заменяет перевод словарным, остальное не трогает", () => {
    const dictionary = new Map([
      ["일", "работа; день, число"],
      ["끼다", "носить на пальцах; затягиваться"],
    ]);
    const result = applyDictionaryTranslations(blocks, dictionary) as typeof blocks;
    expect(result[0].items?.[0].translation_ru).toBe("работа; день, число");
    expect(result[0].items?.[1].translation_ru).toBe("форма от 예쁘다");
    expect(result[0].extra_words?.text_vocab[0].translation_ru).toBe("носить на пальцах; затягиваться");
    expect(result[1].lines?.[0].translation_ru).toBe("Да");
    expect(blocks[0].items?.[0].translation_ru).toBe("день, число");
  });

  it("склеивает значения по порядку external_id", () => {
    expect(
      joinDictionaryTranslations([
        { external_id: "word-일-tr-2", text: "один" },
        { external_id: "word-일-tr-10", text: "день" },
        { external_id: "word-일-tr-1", text: "работа" },
      ]),
    ).toBe("работа; один; день");
  });
});
