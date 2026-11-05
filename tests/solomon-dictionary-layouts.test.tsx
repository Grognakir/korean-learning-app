import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Dictionary } from "@/features/solomonOs/dictionary/Dictionary";
import { DICTIONARY_LAYOUTS } from "@/features/solomonOs/dictionary/layouts";
import { DictionaryLab } from "@/features/solomonOs/dictionary/DictionaryLab";
import { createOsStore } from "@/features/solomonOs/store";
import { emptyDictionary, putEntry, readDictionary, writeDictionary } from "@/features/solomonOs/dictionary/entries";

beforeEach(() => {
  localStorage.clear();
  const data = putEntry(emptyDictionary(), { ko: "사과", ru: "яблоко", groups: ["Еда"] }, 1, "a").data;
  writeDictionary(createOsStore(), data);
});
describe("Семь компоновок словаря", () => {
  it.each(DICTIONARY_LAYOUTS)("$name: выбирает запись, редактирует и сохраняет", ({ id }) => {
    const { container } = render(<Dictionary layout={id}/>);
    expect(container.querySelector("select, datalist")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^사과/ }));
    if (id === "reference") {
      expect(screen.getByRole("article", { name: "Запись: 사과" })).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "수정 · Изменить" }));
    }
    fireEvent.change(screen.getByRole("textbox", { name: "번역 · Перевод" }), { target: { value: "яблоко; плод" } });
    fireEvent.click(screen.getByRole("button", { name: "저장 · Сохранить" }));
    expect(readDictionary(createOsStore()).words[0].ru).toBe("яблоко; плод");
  });
  it("основной вид — каталог с узкими группами, без вкладок и встроенного редактора", () => {
    createOsStore().save("dictionaryLayout", "explorer");
    const { container } = render(<Dictionary/>);
    expect(container.querySelector('[data-dictionary-layout="catalog"]')).toBeTruthy();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("textbox", { name: "한국어 · Корейский" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Варианты словаря" })).toBeNull();
    expect(screen.getByRole("navigation", { name: "Коллекции" })).toBeTruthy();
  });
  it("демонстрация не добавляет записи в личную коллекцию и не трогает её статистику", () => {
    const before = readDictionary(createOsStore());
    render(<DictionaryLab userId="preview-user" references={[]}/>);
    const rail = screen.getByRole("navigation", { name: "7 вариантов словаря" });
    expect(within(rail).getAllByRole("button")).toHaveLength(7);
    for (const button of within(rail).getAllByRole("button")) fireEvent.click(button);
    expect(readDictionary(createOsStore())).toEqual(before);
    expect(readDictionary(createOsStore("preview-user:dictionary-design-lab", false)).words.length).toBeGreaterThan(1);
  });
});
