import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Dictionary } from "@/features/solomonOs/dictionary/Dictionary";
import { loadLibrary } from "@/features/solomonOs/dictionary/loadLibrary";
import { createOsStore } from "@/features/solomonOs/store";
import { emptyDictionary, putEntry, readDictionary, writeDictionary } from "@/features/solomonOs/dictionary/entries";
import type { LibraryRecord } from "@/features/solomonOs/dictionary/reference";

vi.mock("@/features/solomonOs/dictionary/loadLibrary", () => ({ LIBRARY_PAGE_SIZE: 20, loadLibrary: vi.fn() }));
const record: LibraryRecord = { id: "apple", kind: "word", ko: "사과", ru: "яблоко; плод яблони", sections: [{ title: "Примечание", blocks: [{ type: "text", text: "Справка общего словаря" }] }] };
const store = createOsStore();
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const fill = (name: string, value: string) => fireEvent.change(screen.getByRole("textbox", { name }), { target: { value } });
const korean = (value: string) => fill("한국어 · Корейский", value);
const translation = () => (screen.getByRole("textbox", { name: "번역 · Перевод" }) as HTMLInputElement).value;
const tick = () => act(async () => { vi.advanceTimersByTime(350); await Promise.resolve(); });
function open() { render(<Dictionary/>); click("Новая запись"); }
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.mocked(loadLibrary).mockReset().mockResolvedValue({ records: [record], count: 1 }); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

it("после паузы подставляет точный общий перевод, а сохранение хранит источник и справку", async () => {
  open(); korean("사"); await act(async () => { vi.advanceTimersByTime(200); }); korean("사과");
  expect(loadLibrary).not.toHaveBeenCalled(); await tick();
  expect(loadLibrary).toHaveBeenCalledTimes(1);
  expect(loadLibrary).toHaveBeenCalledWith("word", "사과", 1, undefined, true);
  expect(translation()).toBe(record.ru); expect(readDictionary(store).words).toHaveLength(0);
  expect(screen.queryByRole("tooltip")).toBeNull();
  click("Источник перевода"); expect(screen.getByRole("tooltip").textContent).toContain(record.ru);
  click("Источник перевода"); expect(screen.queryByRole("tooltip")).toBeNull();
  click("추가 · Добавить");
  expect(readDictionary(store).words[0]).toMatchObject({ ko: "사과", ru: record.ru, source: { id: record.id, kind: "word" }, reference: record });
  expect(translation()).toBe(""); expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "한국어 · Корейский" }));
});
it("не заменяет свой перевод, введённый до ответа общего словаря", async () => {
  open(); korean("사과"); fill("번역 · Перевод", "мой перевод"); await tick();
  expect(translation()).toBe("мой перевод"); expect(screen.queryByText("Перевод из общего словаря")).toBeNull();
  click("추가 · Добавить"); expect(readDictionary(store).words[0]).toMatchObject({ ru: "мой перевод", reference: { ru: record.ru } });
});
it("автоперевод можно изменить и явно очистить, пустое поле не заполняется снова", async () => {
  open(); korean("사과"); await tick(); fill("번역 · Перевод", record.ru + "; мой вариант");
  expect(translation()).toBe(record.ru + "; мой вариант");
  click("Источник перевода"); expect(screen.getByRole("tooltip").textContent).toContain(record.ru);
  fill("번역 · Перевод", "");
  expect(translation()).toBe(""); await tick(); expect(translation()).toBe("");
  click("추가 · Добавить"); expect(readDictionary(store).words[0].ru).toBe("");
});
it("подсказка источника открывается наведением, фокусом и нажатием; закрывается Escape и снаружи", async () => {
  open(); korean("사과"); await tick();
  const trigger = screen.getByRole("button", { name: "Источник перевода" });
  fireEvent.mouseOver(trigger); expect(screen.getByRole("tooltip").textContent).toContain("Перевод из общего словаря");
  fireEvent.mouseOut(trigger, { relatedTarget: document.body }); expect(screen.queryByRole("tooltip")).toBeNull();
  fireEvent.focus(trigger); expect(screen.getByRole("tooltip")).toBeTruthy();
  fireEvent.keyDown(trigger, { key: "Escape" });
  expect(screen.queryByRole("tooltip")).toBeNull(); expect(screen.getByRole("dialog")).toBeTruthy();
  fireEvent.click(trigger); expect(trigger.getAttribute("aria-expanded")).toBe("true");
  fireEvent.pointerDown(screen.getByRole("textbox", { name: "번역 · Перевод" }));
  expect(screen.queryByRole("tooltip")).toBeNull(); expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(translation()).toBe(record.ru);
});
it("игнорирует ответ на прежнее слово и сбрасывает автоматический перевод при очистке названия", async () => {
  const resolvers: ((value: { records: LibraryRecord[]; count: number }) => void)[] = [];
  vi.mocked(loadLibrary).mockImplementation(() => new Promise((resolve) => resolvers.push(resolve)));
  open(); korean("사과"); await tick(); korean("학교"); await tick();
  await act(async () => resolvers[0]({ records: [record], count: 1 })); expect(translation()).toBe("");
  await act(async () => resolvers[1]({ records: [{ ...record, id: "school", ko: "학교", ru: "школа" }], count: 1 }));
  expect(translation()).toBe("школа"); korean(""); expect(translation()).toBe("");
});
it("совпадение по подстроке не подставляет перевод другого слова", async () => {
  vi.mocked(loadLibrary).mockResolvedValue({ records: [{ ...record, ko: "사과즙", ru: "яблочный сок" }], count: 1 });
  open(); korean("사과"); await tick(); expect(translation()).toBe("");
});
it("смена типа ищет материал заново, справка может содержать корейские вставки в переводе", async () => {
  const phrase = { ...record, kind: "phrase" as const, ko: "안녕하세요", ru: "здравствуйте (안녕)" };
  vi.mocked(loadLibrary).mockResolvedValue({ records: [phrase], count: 1 });
  open(); click("표현 · Фразы"); korean("안녕하세요"); await tick();
  expect(loadLibrary).toHaveBeenLastCalledWith("phrase", "안녕하세요", 1, undefined, true);
  expect(translation()).toBe(phrase.ru); click("추가 · Добавить");
  expect(readDictionary(store).words[0]).toMatchObject({ kind: "phrase", ru: phrase.ru, reference: phrase });
});
it("при ошибке сети оставляет ручной ввод и сохранение доступными", async () => {
  vi.mocked(loadLibrary).mockRejectedValue(new Error("offline"));
  open(); korean("사과"); await tick(); expect(translation()).toBe("");
  fill("번역 · Перевод", "яблоко"); click("추가 · Добавить");
  expect(readDictionary(store).words[0]).toMatchObject({ ko: "사과", ru: "яблоко" });
});
it("не запрашивает перевод при редактировании личной записи", async () => {
  writeDictionary(store, putEntry(emptyDictionary(), { ko: "사과", ru: "мой перевод" }, 1, "a").data);
  render(<Dictionary/>); click("Изменить: 사과"); await tick();
  expect(loadLibrary).not.toHaveBeenCalled(); expect(translation()).toBe("мой перевод");
  korean("학교"); await tick(); expect(loadLibrary).not.toHaveBeenCalled(); expect(translation()).toBe("мой перевод");
});
