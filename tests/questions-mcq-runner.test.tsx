import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
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

it("сразу переходит к следующему вопросу после верного ответа", () => {
  renderRunner();
  fireEvent.click(screen.getByRole("button", { name: "кто" }));

  expect(screen.getByText("어디")).toBeDefined();
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.queryByRole("button", { name: "Далее" })).toBeNull();
});

it("после ошибки оставляет объяснение и ручной переход", () => {
  renderRunner();
  fireEvent.click(screen.getByRole("button", { name: "где" }));

  expect(screen.getByRole("status").textContent).toContain("Не совсем.");
  expect(screen.getByRole("button", { name: "Далее" })).toBeDefined();
  expect(screen.getAllByText("누구")).toHaveLength(2);
});

it("показывает три равноценных действия после завершения", () => {
  render(
    <McqRunner
      title="Слово → перевод"
      buildSession={() => [items[0]]}
      onBack={vi.fn()}
      onNextLevel={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "кто" }));

  expect(screen.getByRole("button", { name: "Все уровни" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Ещё раз" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Следующий уровень" })).toBeDefined();
});
