import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { NewCardsSlider } from "@/features/trainers/flashcards/components/NewCardsSlider";

vi.mock("@/features/trainers/flashcards/actions", () => ({
  updateNewCardsLimit: vi.fn(),
}));

it("ограничивает максимум числом оставшихся новых карточек", () => {
  render(<NewCardsSlider initialValue={50} availableCount={21} />);

  const slider = screen.getByRole("slider", { name: "Новых карт за сессию" });
  expect(slider.getAttribute("aria-valuemax")).toBe("21");
  expect(slider.getAttribute("aria-valuenow")).toBe("21");
  expect(screen.getByText("Доступно новых: 21")).toBeDefined();
});

it("показывает ноль и отключает регулятор, когда новых карточек нет", () => {
  render(<NewCardsSlider initialValue={50} availableCount={0} />);

  const slider = screen.getByRole("slider", { name: "Новых карт за сессию" });
  expect(slider.getAttribute("aria-valuenow")).toBe("0");
  expect(slider.getAttribute("aria-disabled")).toBe("true");
});
