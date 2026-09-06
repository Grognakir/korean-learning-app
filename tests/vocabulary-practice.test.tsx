import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { PairSession } from "@/features/trainers/vocabulary/PairSession";
import { SpellingSession } from "@/features/trainers/vocabulary/SpellingSession";
import { makeSpellingItems, selectPracticeWords, type PracticeWord } from "@/features/trainers/vocabulary/exercises";

const cat: PracticeWord = { id: "cat", headword: "cat", translation: "кот", language: "en" };
const dog: PracticeWord = { id: "dog", headword: "dog", translation: "собака", language: "en" };
const spelling = [{ word: cat, tiles: [{ id: 1, text: "a" }, { id: 2, text: "t" }, { id: 0, text: "c" }] }];

it("убирает пустые переводы, одинаковые пары и составные слова", () => {
  const rows = [
    { id: "1", headword: "cat", translations: [{ text: "кот" }] },
    { id: "2", headword: "CAT", translations: [{ text: "кошка" }] },
    { id: "3", headword: "kitty", translations: [{ text: "КОТ" }] },
    { id: "4", headword: "ice cream", translations: [{ text: "мороженое" }] },
    { id: "5", headword: "dog", translations: [] },
  ];
  expect(selectPracticeWords(rows, "en")).toEqual([{ id: "1", headword: "cat", translation: "кот", language: "en" }]);
});

it("сохраняет повторяющиеся буквы отдельными плитками", () => {
  const [{ tiles }] = makeSpellingItems([{ ...cat, headword: "letter" }]);
  expect(tiles).toHaveLength(6);
  expect(new Set(tiles.map(t => t.id)).size).toBe(6);
  expect(tiles.filter(t => t.text === "t")).toHaveLength(2);
});

it("считает неправильные пары и завершает раунд только после всех совпадений", () => {
  render(<PairSession initialRounds={[{ words: [cat, dog], translationIds: ["dog", "cat"] }]} />);
  fireEvent.click(screen.getByRole("button", { name: "cat" }));
  fireEvent.click(screen.getByRole("button", { name: "собака" }));
  expect(screen.getByRole("status").textContent).toContain("не составляют пару");
  expect(screen.queryByRole("button", { name: "Посмотреть результат" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "кот" }));
  fireEvent.click(screen.getByRole("button", { name: "cat" }));
  expect(screen.getByRole("button", { name: "✓ cat" }).hasAttribute("disabled")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "dog" }));
  fireEvent.click(screen.getByRole("button", { name: "собака" }));
  fireEvent.click(screen.getByRole("button", { name: "Посмотреть результат" }));
  expect(screen.getByText("Все пары найдены")).toBeDefined();
  expect(screen.getByText("Ошибочных попыток: 1")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Перемешать и повторить" }));
  expect(screen.getByRole("button", { name: "cat" }).hasAttribute("disabled")).toBe(false);
});

function add(text: string, id: number) {
  fireEvent.click(screen.getByRole("button", { name: `Добавить ${text}, кнопка ${id}` }));
}
it("проверяет написание и позволяет исправить порядок до ответа", () => {
  render(<SpellingSession initialItems={spelling} />);
  expect(screen.getByRole("button", { name: "Проверить" }).hasAttribute("disabled")).toBe(true);
  add("a", 1);
  fireEvent.click(within(screen.getByRole("group", { name: "Ваш ответ" })).getByRole("button"));
  add("c", 3); add("a", 1); add("t", 2);
  fireEvent.click(screen.getByRole("button", { name: "Проверить" }));
  expect(screen.getByRole("status").textContent).toContain("Верно!");
  fireEvent.click(screen.getByRole("button", { name: "Посмотреть результат" }));
  expect(screen.getByText("1 / 1")).toBeDefined();
  expect(screen.queryByRole("button", { name: /Закрепить сложные/ })).toBeNull();
});

it("добавляет слово с подсказкой в повтор, даже при верном ответе", () => {
  render(<SpellingSession initialItems={spelling} />);
  fireEvent.click(screen.getByRole("button", { name: "Подсказка" }));
  add("c", 3); add("a", 1); add("t", 2);
  fireEvent.click(screen.getByRole("button", { name: "Проверить" }));
  fireEvent.click(screen.getByRole("button", { name: "Посмотреть результат" }));
  expect(screen.getByText("0 / 1")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Закрепить сложные (1)" }));
  expect(screen.getByRole("button", { name: "Проверить" }).hasAttribute("disabled")).toBe(true);
});
it("показывает правильное написание после ошибки", () => {
  render(<SpellingSession initialItems={spelling} />);
  add("t", 2); add("a", 1); add("c", 3);
  fireEvent.click(screen.getByRole("button", { name: "Проверить" }));
  expect(screen.getByRole("status").textContent).toContain("Запомните написание: cat");
  fireEvent.click(screen.getByRole("button", { name: "Посмотреть результат" }));
  expect(screen.getByRole("list", { name: "Слова для повторения" }).textContent).toContain("cat");
});
