import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { WordEditForm } from "@/features/dictionary/components/WordEditForm";

it("сохраняет введённое слово и разблокирует форму после обрыва сети", async () => {
  const onSave = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ success: true });
  const onSaved = vi.fn();
  render(<WordEditForm categories={[]} language="en" initialDraft={{ headword: "hello", translation: "привет" }} onSave={onSave} onSaved={onSaved} />);
  fireEvent.click(screen.getByRole("button", { name: "Добавить" }));
  await waitFor(() => expect(screen.getByRole("alert")).toBeDefined());
  expect((screen.getByLabelText("Слово") as HTMLInputElement).value).toBe("hello");
  fireEvent.click(screen.getByRole("button", { name: "Добавить" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
});
