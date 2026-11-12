import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { VocabList } from "@/features/learning/components/blocks/VocabList";
import { VocabTrainer, queueAfterRating } from "@/features/learning/components/blocks/VocabTrainer";
import {
  loadProgress,
  priorityOf,
  priorityOrder,
  recordRating,
} from "@/features/learning/vocabProgress";
import type { VocabListBlock } from "@/features/learning/types";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const base: VocabListBlock = {
  type: "vocab_list",
  title: "단어",
  items: [{ ko: "참다", translation_ru: "терпеть" }],
};

it("не показывает переключатель, если дополнительных слов нет", () => {
  render(<VocabList block={base} />);
  expect(screen.queryByRole("tablist")).toBeNull();

  cleanup();
  render(<VocabList block={{ ...base, extra_words: { text_vocab: [] } }} />);
  expect(screen.queryByRole("tablist")).toBeNull();
});

it("показывает на вкладке «Дополнительные» все слова extra_words без повторов", () => {
  render(
    <VocabList
      block={{
        ...base,
        extra_words: {
          topic_vocab: [{ ko: "직업", translation_ru: "профессия" }],
          text_vocab: [
            { ko: "직업", translation_ru: "профессия (повтор)" },
            { ko: "참다", translation_ru: "терпеть (есть в основных)" },
            { ko: "성격", translation_ru: "характер" },
          ],
          grammar_vocab: [{ ko: "걱정", translation_ru: "тревога" }],
        },
      }}
    />,
  );
  fireEvent.click(screen.getByText("Дополнительные"));
  const words = screen
    .getAllByRole("tooltip")
    .map((el) => el.textContent);
  expect(words).toEqual(["профессия", "характер", "тревога"]);
  expect(screen.getByText("Тренировать слова (3)")).toBeTruthy();
});

it("без основных слов показывает только дополнительные и без вкладок", () => {
  render(
    <VocabList
      block={{ ...base, items: [], extra_words: { text_vocab: [{ ko: "성격", translation_ru: "характер" }] } }}
    />,
  );
  expect(screen.queryByRole("tablist")).toBeNull();
  expect(screen.getByText("Тренировать слова (1)")).toBeTruthy();
});

it("после оценки карточка уходит из очереди или возвращается позже", () => {
  expect(queueAfterRating([5, 6, 7, 8], 0, 0)).toEqual([6, 7, 8]);
  expect(queueAfterRating([5, 6, 7, 8], 0, 2)).toEqual([6, 7, 5, 8]);
  expect(queueAfterRating([5, 6, 7, 8], 1, 4)).toEqual([5, 7, 8, 6]);
  expect(queueAfterRating([5], 0, 2)).toEqual([5]);
});

it("кнопки оценки доступны после показа ответа и ведут по очереди до конца", () => {
  render(
    <VocabTrainer
      items={[
        { ko: "참다", translation_ru: "терпеть" },
        { ko: "성격", translation_ru: "характер" },
      ]}
    />,
  );
  const know = screen.getByRole("button", { name: "Знаю" }) as HTMLButtonElement;
  expect(know.disabled).toBe(true);

  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  expect(know.disabled).toBe(false);
  fireEvent.click(know);
  expect(screen.getByText("1 / 1")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  fireEvent.click(screen.getByRole("button", { name: "Не знаю" }));
  expect(screen.getByText("1 / 1")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  fireEvent.click(screen.getByRole("button", { name: "Вспомнил" }));
  expect(screen.getByText(/Все слова пройдены: 2 из 2/)).toBeTruthy();
});

it("запоминает оценки между тренировками и ставит слабые слова первыми", () => {
  window.localStorage.clear();
  const items = [
    { ko: "참다", translation_ru: "терпеть" },
    { ko: "성격", translation_ru: "характер" },
  ];
  expect(priorityOrder(["참다", "성격"], loadProgress(), 0, () => 0.5)).toEqual([0, 1]);

  recordRating("참다", "easy", Date.now());
  recordRating("성격", "again", Date.now());
  expect(loadProgress()["참다"].rating).toBe("easy");
  expect(priorityOrder(["참다", "성격"], loadProgress(), Date.now(), () => 0.5)).toEqual([1, 0]);

  render(<VocabTrainer items={items} />);
  expect(screen.getByText("Раньше: Не знаю")).toBeTruthy();

  cleanup();
  render(<VocabList block={{ type: "vocab_list", title: "단어", items }} />);
  expect(screen.getByText(/выучено 1/)).toBeTruthy();
  window.localStorage.clear();
});

it("возвращает выученные слова в очередь, когда пора повторить", () => {
  const day = 24 * 60 * 60 * 1000;
  const now = 100 * day;
  expect(priorityOf({ rating: "good", at: now - day, reviews: 1 }, now)).toBe(3);
  expect(priorityOf({ rating: "good", at: now - 4 * day, reviews: 1 }, now)).toBe(2);
  expect(priorityOf({ rating: "easy", at: now - 4 * day, reviews: 1 }, now)).toBe(4);
  expect(priorityOf({ rating: "easy", at: now - 8 * day, reviews: 1 }, now)).toBe(2);
  expect(priorityOf({ rating: "hard", at: now, reviews: 1 }, now)).toBe(1);
});

it("Enter во время ввода корейского (IME) не проверяет ответ", () => {
  render(<VocabTrainer items={[{ ko: "참다", translation_ru: "терпеть" }]} />);
  fireEvent.click(screen.getByRole("button", { name: "Корейское написание" }));
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "참" } });
  fireEvent.keyDown(input, { key: "Enter", keyCode: 229, isComposing: true });
  expect(input.className).toContain("trainerInput");
  expect(input.className).not.toContain("Correct");
  expect(input.className).not.toContain("Incorrect");
  fireEvent.keyDown(input, { key: "Enter", keyCode: 13 });
  expect(input.className).toMatch(/Incorrect/);
});
