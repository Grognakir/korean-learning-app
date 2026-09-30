import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { McqRunner, type McqItem } from "@/features/topics/questions/trainer/McqRunner";

const items: McqItem[] = [
  {
    promptKr: "누구",
    promptRu: null,
    optsAreKr: false,
    opts: ["кто", "где"],
    correctIndex: 0,
    explanationKr: "누구",
    explanationRr: "nugu",
    explanationRu: "кто",
  },
  {
    promptKr: "어디",
    promptRu: null,
    optsAreKr: false,
    opts: ["когда", "где"],
    correctIndex: 1,
    explanationKr: "어디",
    explanationRr: "eodi",
    explanationRu: "где",
  },
];

function renderRunner() {
  render(
    <McqRunner
      title="Слово → перевод"
      buildSession={() => items}
      onBack={vi.fn()}
    />,
  );
}

afterEach(() => {
  vi.useRealTimers();
});

it("после верного ответа блокирует варианты и переходит дальше с паузой", () => {
  vi.useFakeTimers();
  renderRunner();
  const correct = screen.getByRole("button", { name: "кто" });
  fireEvent.click(correct);

  expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
  expect(screen.getByRole("status").textContent).toContain("Верно!");
  expect(screen.queryByRole("button", { name: "Далее" })).toBeNull();
  expect(correct).toHaveProperty("disabled", true);

  fireEvent.click(correct);
  expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");

  act(() => {
    vi.advanceTimersByTime(700);
  });
  expect(screen.getByText("어디")).toBeDefined();
  expect(screen.queryByRole("status")).toBeNull();
});

it("после ошибки оставляет объяснение и ручной переход", () => {
  renderRunner();
  fireEvent.click(screen.getByRole("button", { name: "где" }));

  expect(screen.getByRole("status").textContent).toContain("Не совсем.");
  expect(screen.getByRole("button", { name: "Далее" })).toBeDefined();
  expect(screen.getAllByText("누구")).toHaveLength(2);
});

it("показывает три равноценных действия после завершения", () => {
  vi.useFakeTimers();
  render(
    <McqRunner
      title="Слово → перевод"
      buildSession={() => [items[0]]}
      onBack={vi.fn()}
      onNextLevel={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "кто" }));
  act(() => {
    vi.advanceTimersByTime(700);
  });

  expect(screen.getByRole("button", { name: "Все уровни" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Ещё раз" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Следующий уровень" })).toBeDefined();
});
