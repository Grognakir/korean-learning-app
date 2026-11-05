import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Dictionary } from "@/features/solomonOs/dictionary/Dictionary";
import { createOsStore } from "@/features/solomonOs/store";
import { emptyDictionary, putEntry, readDictionary, writeDictionary } from "@/features/solomonOs/dictionary/entries";

vi.mock("@/features/solomonOs/dictionary/loadLibrary", () => ({ LIBRARY_PAGE_SIZE: 20, loadLibrary: async () => ({ records: [], count: 0 }) }));
const store = createOsStore();
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
beforeEach(() => {
  localStorage.clear();
  let data = putEntry(emptyDictionary(), { ko: "사과", ru: "яблоко", groups: ["Еда"] }, 1, "a").data;
  data = putEntry(data, { ko: "학교", ru: "школа", groups: ["Учёба"] }, 2, "b").data;
  data.words[0].ok = 3; data.words[0].fail = 1;
  writeDictionary(store, data);
});
afterEach(cleanup);

it("главный экран — каталог с группами, одна строка действий +/карточки/книга, без вкладок и встроенной формы", () => {
  const { container } = render(<Dictionary/>);
  expect(screen.getByRole("navigation", { name: "Коллекции" })).toBeTruthy();
  expect(container.querySelector('[data-dictionary-layout="catalog"]')).toBeTruthy();
  expect(screen.queryByRole("tab")).toBeNull();
  expect(container.querySelector("form")).toBeNull();
  expect(screen.queryByRole("combobox")).toBeNull();
  const buttons = within(screen.getByRole("group", { name: "Действия словаря" })).getAllByRole("button");
  expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual(["Новая запись", "Тренировка карточек", "Общий словарь"]);
  expect(buttons.every((button) => !button.textContent && button.querySelector("svg"))).toBe(true);
});
it("+ открывает только модальную форму; фокус внутри, закрытие возвращает его к +", () => {
  render(<Dictionary/>);
  const plus = screen.getByRole("button", { name: "Новая запись" }); plus.focus(); fireEvent.click(plus);
  const modal = screen.getByRole("dialog", { name: "Добавление слова" });
  expect(modal.getAttribute("aria-modal")).toBe("true");
  expect(screen.queryByRole("navigation", { name: "Коллекции" })).toBeNull();
  expect(document.activeElement).toBe(within(modal).getByRole("textbox", { name: "한국어 · Корейский" }));
  expect(screen.queryByRole("textbox", { name: "Группы записи" })).toBeNull();
  const first = within(modal).getByRole("button", { name: "Закрыть диалог" }); first.focus();
  fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(within(modal).getByRole("button", { name: "추가 · Добавить" }));
  fireEvent.keyDown(document.activeElement!, { key: "Tab" }); expect(document.activeElement).toBe(first);
  fireEvent.keyDown(first, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull(); expect(document.activeElement).toBe(plus);
  expect(screen.getByRole("navigation", { name: "Коллекции" })).toBeTruthy();
});
it("редактирование по карандашу сохраняет id, статистику и группы; отмена оставляет исходные данные", () => {
  render(<Dictionary/>); click("Изменить: 사과");
  const ko = screen.getByRole("textbox", { name: "한국어 · Корейский" });
  const ru = screen.getByRole("textbox", { name: "번역 · Перевод" });
  expect((ru as HTMLInputElement).value).toBe("яблоко");
  fireEvent.change(ko, { target: { value: "사과/사과를" } });
  fireEvent.change(ru, { target: { value: "яблоко; плод яблони" } });
  click("저장 · Сохранить");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(readDictionary(store).words[0]).toMatchObject({ id: "a", ko: "사과/사과를", ru: "яблоко; плод яблони", groups: ["Еда"], ok: 3, fail: 1, createdAt: 1 });
  click("Изменить: 사과/사과를");
  fireEvent.change(screen.getByRole("textbox", { name: "번역 · Перевод" }), { target: { value: "не сохранять" } });
  click("취소 · Отмена"); expect(readDictionary(store).words[0].ru).toBe("яблоко; плод яблони");
  cleanup(); render(<Dictionary/>); expect(screen.getByText("яблоко; плод яблони")).toBeTruthy();
});
it("первый Escape закрывает список групп, второй — форму", () => {
  render(<Dictionary/>); click("Новая запись");
  const input = screen.getByRole("combobox", { name: "Группа записи" }); fireEvent.focus(input);
  expect(screen.getByRole("listbox", { name: "Группы записи" })).toBeTruthy();
  fireEvent.keyDown(input, { key: "Escape" });
  expect(screen.queryByRole("listbox")).toBeNull(); expect(screen.getByRole("dialog")).toBeTruthy();
  fireEvent.keyDown(input, { key: "Escape" }); expect(screen.queryByRole("dialog")).toBeNull();
});
it("фильтры открываются по иконке, работают с порталом выбора и сбрасываются", () => {
  render(<Dictionary/>); click("Фильтры словаря");
  fireEvent.click(screen.getByRole("combobox", { name: "Группа личных записей" }));
  const option = screen.getByRole("option", { name: "Еда" }); fireEvent.pointerDown(option); fireEvent.click(option);
  expect(screen.queryByRole("button", { name: "학교" })).toBeNull();
  expect(screen.getByRole("button", { name: "사과" })).toBeTruthy();
  click("가나다 · По алфавиту"); click("초기화 · Сбросить");
  expect(screen.getByRole("button", { name: "학교" })).toBeTruthy();
  fireEvent.keyDown(screen.getByRole("group", { name: "Фильтры словаря" }), { key: "Escape" });
  expect(screen.queryByRole("combobox")).toBeNull();
});
it("карточки и общий словарь открываются модалками и сохраняют контекст поиска каталога", async () => {
  render(<Dictionary/>);
  fireEvent.change(screen.getByRole("textbox", { name: "검색 / Поиск" }), { target: { value: "школа" } });
  click("Тренировка карточек"); expect(screen.getByRole("dialog", { name: "Тренировка карточек" })).toBeTruthy();
  expect(screen.getByRole("group", { name: "Режим карточек" })).toBeTruthy(); click("Закрыть диалог");
  click("Общий словарь"); expect(screen.getByRole("dialog", { name: "Общий словарь" })).toBeTruthy();
  expect(await screen.findByText("Ничего не найдено.")).toBeTruthy(); click("Закрыть диалог");
  expect((screen.getByRole("textbox", { name: "검색 / Поиск" }) as HTMLInputElement).value).toBe("школа");
  expect(screen.queryByRole("button", { name: "사과" })).toBeNull();
});
it("удалённая в другом окне запись не создаётся повторно при открытом редакторе", () => {
  render(<Dictionary/>); click("Изменить: 사과");
  act(() => writeDictionary(store, { v: 1, words: readDictionary(store).words.filter((word) => word.id !== "a") }));
  expect(screen.getByRole("alert").textContent).toBe("Эта запись уже удалена.");
  expect(screen.queryByRole("button", { name: "저장 · Сохранить" })).toBeNull();
  click("닫기 · Закрыть"); expect(readDictionary(store).words).toHaveLength(1);
});
it("группы каталога показывают счётчики, фильтруют и обновляются при переименовании последней записи", () => {
  render(<Dictionary/>);
  const rail = screen.getByRole("navigation", { name: "Коллекции" });
  const food = within(rail).getByRole("button", { name: "Группа: Еда" });
  expect(food.textContent).toContain("1"); fireEvent.click(food);
  expect(food.getAttribute("aria-pressed")).toBe("true");
  expect(screen.queryByRole("button", { name: "학교" })).toBeNull();
  click("Изменить: 사과");
  const input = screen.getByRole("combobox", { name: "Группа записи" }); fireEvent.focus(input);
  fireEvent.click(screen.getByRole("option", { name: "Еда" }));
  fireEvent.change(input, { target: { value: "Фрукты" } }); click("Добавить группу");
  click("저장 · Сохранить");
  expect(screen.queryByRole("button", { name: "Группа: Еда" })).toBeNull();
  expect(screen.getByRole("button", { name: "Группа: Фрукты" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Все записи" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("button", { name: "학교" })).toBeTruthy();
});
it("компактный список выбирает несколько групп, сохранение только по кнопке формы", () => {
  render(<Dictionary/>); click("Новая запись");
  expect(screen.getByRole("textbox", { name: "Заметка записи" })).toBeTruthy();
  expect(screen.getByRole("group", { name: "Тип записи" })).toBeTruthy();
  const input = screen.getByRole("combobox", { name: "Группа записи" });
  for (const name of ["Еда", "Учёба"]) { fireEvent.click(input); fireEvent.click(screen.getByRole("option", { name })); expect(screen.queryByRole("listbox")).toBeNull(); }
  fireEvent.click(input);
  expect(screen.getByRole("option", { name: "Еда", selected: true })).toBeTruthy();
  expect(screen.getByRole("option", { name: "Учёба", selected: true })).toBeTruthy();
  expect(screen.getByText("+1")).toBeTruthy();
  expect(readDictionary(store).words).toHaveLength(2);
  click("취소 · Отмена"); click("Новая запись");
  expect((screen.getByRole("combobox", { name: "Группа записи" }) as HTMLInputElement).value).toBe("");
});
it("фильтрует группы, выбирает стрелками и показывает + только для нового названия", () => {
  render(<Dictionary/>); click("Новая запись");
  const input = screen.getByRole("combobox", { name: "Группа записи" });
  fireEvent.change(input, { target: { value: "уч" } });
  expect(screen.queryByRole("option", { name: "Еда" })).toBeNull();
  expect(screen.getByRole("option", { name: "Учёба" })).toBeTruthy();
  fireEvent.keyDown(input, { key: "ArrowDown" }); fireEvent.keyDown(input, { key: "Enter" });
  expect((input as HTMLInputElement).value).toBe("Учёба");
  expect(screen.queryByRole("button", { name: "Добавить группу" })).toBeNull();
  fireEvent.change(input, { target: { value: "  Мои   слова  " } });
  expect(screen.queryByRole("listbox")).toBeNull(); click("Добавить группу");
  expect((input as HTMLInputElement).value).toBe("Мои слова");
  fireEvent.change(input, { target: { value: "мои слова" } });
  expect(screen.queryByRole("button", { name: "Добавить группу" })).toBeNull();
  fireEvent.keyDown(input, { key: "Enter" }); fireEvent.click(input);
  expect(screen.getAllByRole("option", { name: "Мои слова", selected: true })).toHaveLength(1);
  expect(readDictionary(store).words).toHaveLength(2);
});
it("список в портале не меняет форму, Tab закрывает его; запятая не создаёт две группы", () => {
  render(<Dictionary/>); click("Новая запись");
  const input = screen.getByRole("combobox", { name: "Группа записи" }); fireEvent.focus(input);
  expect(screen.getByRole("dialog").contains(screen.getByRole("listbox"))).toBe(false);
  fireEvent.keyDown(input, { key: "Tab" }); expect(screen.queryByRole("listbox")).toBeNull();
  fireEvent.change(input, { target: { value: "Раз, два" } }); fireEvent.keyDown(input, { key: "Enter" });
  expect(screen.getByRole("alert").textContent).toContain("без запятых");
  click("취소 · Отмена"); expect(screen.queryByRole("dialog")).toBeNull();
  expect(readDictionary(store).words).toHaveLength(2);
});
