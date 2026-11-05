import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dictionary } from "@/features/solomonOs/dictionary/Dictionary";
import { createOsStore } from "@/features/solomonOs/store";
import { emptyDictionary, entryKind, importRecord, putEntry, readDictionary, trainableWords, writeDictionary } from "@/features/solomonOs/dictionary/entries";
import { fromGrammar, fromPhrase, fromWord, type LibraryRecord } from "@/features/solomonOs/dictionary/reference";
import { loadLibrary } from "@/features/solomonOs/dictionary/loadLibrary";
import type { GrammarPoint, Phrase, Word } from "@/features/dictionary/types";

vi.mock("@/features/solomonOs/dictionary/loadLibrary", () => ({ LIBRARY_PAGE_SIZE: 20, loadLibrary: vi.fn() }));
const word: LibraryRecord = { id: "common-word", kind: "word", ko: "사과", ru: "яблоко", sections: [{ title: "Примеры", blocks: [{ type: "examples", items: [{ kr: "사과", ru: "яблоко" }] }] }] };
const phrase: LibraryRecord = { id: "common-phrase", kind: "phrase", ko: "안녕하세요", ru: "здравствуйте", sections: [] };
const grammar: LibraryRecord = { id: "common-grammar", kind: "grammar", ko: "N(이)라고 하다", ru: "называться", sections: [{ title: "Правила", blocks: [{ type: "text", text: "Сохранённое объяснение" }, { type: "table", head: ["Форма", "Пример"], rows: [["N", "이름"]] }] }] };
const store = createOsStore();
const choose = (name: string, option: string) => { fireEvent.click(screen.getByRole("combobox", { name })); fireEvent.click(screen.getByRole("option", { name: option })); };
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
beforeEach(() => {
  localStorage.clear();
  vi.mocked(loadLibrary).mockImplementation(async (kind) => ({ records: [{ word, phrase, grammar }[kind]], count: 1 }));
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Общий словарь и личные группы", () => {
  it("открывает справку, добавляет в свою группу, хранит источник и защищает от повторного добавления", async () => {
    render(<Dictionary/>);
    click("Общий словарь");
    await screen.findByRole("button", { name: /사과.*яблоко/ }); click(/사과.*яблоко/);
    expect(screen.getByRole("article", { name: "Справка: 사과" })).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "그룹 · В группу" }), { target: { value: "Еда" } });
    click("＋ 내 사전 · В мою коллекцию");
    expect(readDictionary(store).words[0]).toMatchObject({ source: { kind: "word", id: "common-word" }, groups: ["Еда"], reference: word });
    expect(screen.queryByRole("button", { name: "＋ 내 사전 · В мою коллекцию" })).toBeNull();
    click("내 사전 · В моей коллекции");
    expect(screen.getByRole("dialog", { name: "Редактирование слова" })).toBeTruthy();
    fireEvent.click(screen.getByRole("combobox", { name: "Группа записи" }));
    expect(screen.getByRole("option", { name: "Еда", selected: true })).toBeTruthy();
    click("원문 · Открыть источник");
    await waitFor(() => expect(loadLibrary).toHaveBeenLastCalledWith("word", "", 1, "common-word"));
    await screen.findByRole("article", { name: "Справка: 사과" });
    expect(readDictionary(store).words).toHaveLength(1);
  });
  it("сохраняет фразы и полную грамматику, фильтрует коллекцию и карточки по группам и типам", async () => {
    let data = importRecord(emptyDictionary(), word, ["Еда"]).data;
    data = importRecord(data, phrase, ["Общение"]).data;
    data = importRecord(data, grammar, ["Урок"]).data;
    writeDictionary(store, data);
    render(<Dictionary/>);
    click("Фильтры словаря");
    choose("Тип личных записей", "문법 · Грамматика");
    expect(screen.queryByRole("button", { name: /^사과/ })).toBeNull();
    click(/^N\(이\)라고 하다/);
    fireEvent.click(screen.getByText("Сохранённая справка"));
    expect(screen.getByText("Сохранённое объяснение")).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
    click("Закрыть диалог");
    choose("Тип личных записей", "전체 · Все типы");
    choose("Группа личных записей", "Еда");
    expect(screen.getByRole("button", { name: /^사과/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^안녕하세요/ })).toBeNull();
    click("Тренировка карточек");
    expect(screen.getByText("단어 2 · Слов: 2")).toBeTruthy();
    choose("Группа для карточек", "Общение");
    expect(screen.getByText("단어 1 · Слов: 1")).toBeTruthy();
    click(/^러 → 한 · 쓰기/); click("시작 · Начать");
    expect(screen.getByText("здравствуйте")).toBeTruthy();
  });
  it("свои фразы, группы и заметки сохраняются без готового наполнения", () => {
    render(<Dictionary/>);
    click("Новая запись");
    click("표현 · Фразы");
    fireEvent.change(screen.getByRole("textbox", { name: "한국어 · Корейский" }), { target: { value: "안녕하세요" } });
    fireEvent.change(screen.getByRole("textbox", { name: "번역 · Перевод" }), { target: { value: "здравствуйте" } });
    for (const name of ["Общение", "Урок", "Общение"]) {
      const input = screen.getByRole("combobox", { name: "Группа записи" });
      fireEvent.change(input, { target: { value: name } }); fireEvent.keyDown(input, { key: "Enter" });
    }
    fireEvent.change(screen.getByRole("textbox", { name: "Заметка записи" }), { target: { value: "Моя заметка" } });
    click("추가 · Добавить");
    expect(readDictionary(store).words[0]).toMatchObject({ kind: "phrase", groups: ["Общение", "Урок"], notes: "Моя заметка" });
    expect(loadLibrary).not.toHaveBeenCalled();
  });
  it("ошибка загрузки и повтор, пустой результат", async () => {
    vi.mocked(loadLibrary).mockRejectedValueOnce(new Error("offline"));
    render(<Dictionary/>); click("Общий словарь");
    expect(await screen.findByRole("alert")).toBeTruthy();
    click("다시 · Повторить");
    await screen.findByRole("button", { name: /사과.*яблоко/ });
    vi.mocked(loadLibrary).mockResolvedValueOnce({ records: [], count: 0 });
    click(/^표현/); expect(await screen.findByText("Ничего не найдено.")).toBeTruthy();
  });
  it("устаревший ответ запроса не заменяет новый тип записей", async () => {
    let resolve!: (result: { records: LibraryRecord[]; count: number }) => void;
    vi.mocked(loadLibrary).mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    render(<Dictionary/>); click("Общий словарь");
    click(/^문법/);
    await screen.findByRole("button", { name: /N\(이\)라고 하다/ });
    resolve({ records: [word], count: 1 });
    await waitFor(() => expect(screen.queryByRole("button", { name: /사과.*яблоко/ })).toBeNull());
    expect(screen.getByRole("button", { name: /N\(이\)라고 하다/ })).toBeTruthy();
  });
});

describe("Совместимость и содержимое справок", () => {
  it("старые слова v1 остаются словами; грамматика вне тренировок, дубли разделены по типам", () => {
    const old = putEntry(emptyDictionary(), { ko: "사과", ru: "яблоко" }).data;
    expect(entryKind(old.words[0])).toBe("word");
    const duplicate = importRecord(old, word);
    expect(duplicate.error).toBe("duplicate");
    const withGrammar = importRecord(old, { ...grammar, ko: "사과" });
    expect(withGrammar.error).toBeUndefined();
    expect(trainableWords(withGrammar.data)).toHaveLength(1);
    expect(importRecord(withGrammar.data, { ...grammar, ko: "사과" }).error).toBe("duplicate");
  });
  it("копирует все блоки источников и не теряет корейские примеры в объяснении", () => {
    const converted = fromGrammar({ id: "g", pattern: "N(이)라고 하다", short_desc: "이름: называться", category: "c", explanation: "Описание", usage: ["Использование"], rules: ["Правило"], examples: [{ kr: "이름", ru: "имя" }], notes: [{ title: "Таблица", section: true, blocks: [{ type: "table", head: ["А"], rows: [["Б"]] }] }], vocab: [{ kr: "단어", ru: "слово" }] } as GrammarPoint);
    expect(converted.sections.map((s) => s.title)).toEqual(["Группа", "Объяснение", "Когда используется", "Правила", "Таблица", "Примеры", "Связанные слова"]);
    const imported = importRecord(emptyDictionary(), converted);
    expect(imported.error).toBeUndefined();
    writeDictionary(store, imported.data);
    expect(readDictionary(store).words[0].reference).toEqual(converted);
    const latin = importRecord(emptyDictionary(), { ...word, ko: "KTX" });
    expect(latin.error).toBeUndefined();
    writeDictionary(store, latin.data);
    expect(readDictionary(store).words[0].ko).toBe("KTX");
    expect(putEntry(emptyDictionary(), { ko: "KTX", ru: "поезд" }).error).toBe("korean");
    expect(fromPhrase({ id: "p", phrase_kr: "안녕하세요", translation: "здравствуйте", usage_note: "Примечание" } as Phrase).sections[0].title).toBe("Использование");
    expect(fromWord({ id: "w", headword: "사과", translations: [{ text: "яблоко" }], word_notes: [{ text: "Пометка" }] } as Word).sections[0].blocks[0]).toEqual({ type: "bullets", items: ["Пометка"] });
  });
});
