import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SessionSettings } from "@/features/trainers/flashcards/components/SessionSettings";

afterEach(() => {
  vi.unstubAllGlobals();
});

it("держит настройки в разметке и переключает раскрытие панели", () => {
  render(
    <SessionSettings summary="Основной · 20 новых · Все категории">
      <button type="button">Все категории</button>
    </SessionSettings>,
  );

  expect(screen.getByRole("button", { name: "Все категории" })).toBeDefined();

  const toggle = screen.getByRole("button", { name: /Основной/ });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  fireEvent.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
});

it("открывает настройки модальным окном на узком экране", () => {
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));

  render(
    <SessionSettings summary="Основной · 20 новых · Все категории">
      <button type="button">Все категории</button>
    </SessionSettings>,
  );

  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /Основной/ }));
  expect(screen.getByRole("dialog", { name: "Настройки карточек" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Все категории" })).toBeDefined();
});
