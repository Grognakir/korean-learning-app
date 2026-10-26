import { expect, it } from "vitest";
import {
  dictionaryPageUrl,
  parseDictionaryQuery,
  parseDictionaryTab,
} from "@/features/dictionary/dictionarySearchUrl";

it("читает вкладку и запрос из адресной строки", () => {
  expect(parseDictionaryTab(undefined)).toBe("words");
  expect(parseDictionaryTab("grammar")).toBe("grammar");
  expect(parseDictionaryTab(["phrases"])).toBe("phrases");
  expect(parseDictionaryQuery(undefined)).toBe("");
  expect(parseDictionaryQuery("나요")).toBe("나요");
});

it("держит поиск грамматики в адресе, чтобы он переживал перезагрузку", () => {
  expect(dictionaryPageUrl("words", "")).toBe("/dictionary");
  expect(dictionaryPageUrl("grammar", "")).toBe("/dictionary?tab=grammar");
  expect(dictionaryPageUrl("grammar", "나요")).toBe(
    "/dictionary?tab=grammar&q=%EB%82%98%EC%9A%94",
  );
  expect(dictionaryPageUrl("phrases", "ignore")).toBe("/dictionary?tab=phrases");
});
