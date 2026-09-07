import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SessionSettings } from "@/features/trainers/flashcards/components/SessionSettings";

it("держит настройки в разметке и переключает раскрытие панели", () => {
  render(
    <SessionSettings summary="Основной · 20 новых · Все категории">
      <button type="button">Все категории</button>
    </SessionSettings>,
  );

  // Панель остаётся в DOM в любом состоянии: на широком экране её
  // показывает CSS, поэтому скрывать её из разметки нельзя.
  expect(screen.getByRole("button", { name: "Все категории" })).toBeDefined();

  const toggle = screen.getByRole("button", { name: /Основной/ });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  fireEvent.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
});
