import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";

const { updateActiveLanguage, refresh } = vi.hoisted(() => ({ updateActiveLanguage: vi.fn(), refresh: vi.fn() }));
vi.mock("@/features/settings/actions", () => ({ updateActiveLanguage }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

it("обновляет выбор при изменении языка извне", () => {
  const { rerender } = render(<LanguageSwitch initialLanguage="ko" />);
  rerender(<LanguageSwitch initialLanguage="en" />);
  expect(screen.getByRole("tab", { name: "English" }).getAttribute("aria-selected")).toBe("true");
});

it("сохраняет прежний язык и показывает ошибку при отказе сохранения", async () => {
  updateActiveLanguage.mockResolvedValue({ error: "Не удалось сохранить язык" });
  render(<LanguageSwitch initialLanguage="ko" />);
  fireEvent.click(screen.getByRole("tab", { name: "English" }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Не удалось"));
  await waitFor(() => expect(screen.getByRole("tab", { name: "한국어" }).getAttribute("aria-selected")).toBe("true"));
});

it("обрабатывает обрыв сети и позволяет повторить выбор", async () => {
  updateActiveLanguage.mockRejectedValue(new Error("offline"));
  render(<LanguageSwitch initialLanguage="ko" />);
  fireEvent.click(screen.getByRole("tab", { name: "English" }));
  await waitFor(() => expect(screen.getByRole("alert")).toBeDefined());
  await waitFor(() => expect(screen.getByRole("tab", { name: "English" }).hasAttribute("disabled")).toBe(false));
});
