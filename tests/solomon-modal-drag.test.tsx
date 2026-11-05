import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { OsModal } from "@/features/solomonOs/controls/OsModal";
import { Dictionary } from "@/features/solomonOs/dictionary/Dictionary";

vi.mock("@/features/solomonOs/dictionary/loadLibrary", () => ({ LIBRARY_PAGE_SIZE: 20, loadLibrary: async () => ({ records: [], count: 0 }) }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const rect = (x: number, y: number, width: number, height: number) => ({ x, y, left: x, top: y, right: x + width, bottom: y + height, width, height, toJSON: () => ({}) });
function pointer(target: Element, name: string, x: number, y: number) {
  const event = new Event(name, { bubbles: true });
  Object.assign(event, { clientX: x, clientY: y, pointerId: 1, button: 0 });
  fireEvent(target, event);
}
function editor() {
  render(<OsModal label="Редактор" title="Редактор" onClose={vi.fn()} restoreFocus={vi.fn()} draggable dimmed={false}><input aria-label="Слово"/></OsModal>);
  const dialog = screen.getByRole("dialog"), header = screen.getByRole("heading").closest("header")!;
  vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue(rect(200, 100, 400, 200));
  vi.spyOn(dialog.parentElement!, "getBoundingClientRect").mockReturnValue(rect(0, 0, 1024, 768));
  return { dialog, header };
}
it("только редактор словаря открывается без затемнения и поддерживает перемещение", () => {
  localStorage.clear(); render(<Dictionary/>);
  fireEvent.click(screen.getByRole("button", { name: "Новая запись" }));
  let dialog = screen.getByRole("dialog");
  expect(dialog.getAttribute("data-draggable")).toBe("true");
  expect(dialog.parentElement!.getAttribute("data-dimmed")).toBe("false");
  fireEvent.click(screen.getByRole("button", { name: "Закрыть диалог" }));
  fireEvent.click(screen.getByRole("button", { name: "Тренировка карточек" }));
  dialog = screen.getByRole("dialog");
  expect(dialog.getAttribute("data-draggable")).toBe("false");
  expect(dialog.parentElement!.getAttribute("data-dimmed")).toBe("true");
});
it("переносит за заголовок, ограничивает краями экрана и сохраняет ширину", () => {
  const { dialog, header } = editor();
  pointer(header, "pointerdown", 250, 120); pointer(header, "pointermove", 400, 220);
  expect(dialog.style.left).toBe("350px"); expect(dialog.style.top).toBe("200px"); expect(dialog.style.width).toBe("400px");
  pointer(header, "pointermove", 9999, 9999);
  expect(Number.parseFloat(dialog.style.left) + 400).toBeLessThanOrEqual(window.innerWidth - 8);
  expect(Number.parseFloat(dialog.style.top) + 200).toBeLessThanOrEqual(window.innerHeight - 8);
  pointer(header, "pointermove", -9999, -9999);
  expect(dialog.style.left).toBe("8px"); expect(dialog.style.top).toBe("8px");
  pointer(header, "pointerup", -9999, -9999); pointer(header, "pointermove", 300, 300);
  expect(dialog.style.left).toBe("8px"); expect(dialog.style.width).toBe("400px");
});
it("не начинает перенос с кнопки закрытия или полей и помещается после сужения viewport", () => {
  const { dialog, header } = editor();
  pointer(screen.getByRole("button", { name: "Закрыть диалог" }), "pointerdown", 250, 120); pointer(header, "pointermove", 400, 220);
  expect(dialog.style.left).toBe("");
  pointer(screen.getByRole("textbox"), "pointerdown", 250, 120); pointer(header, "pointermove", 400, 220);
  expect(dialog.style.left).toBe("");
  pointer(header, "pointerdown", 250, 120); pointer(header, "pointermove", 600, 400); pointer(header, "pointercancel", 600, 400);
  vi.stubGlobal("innerWidth", 320); vi.stubGlobal("innerHeight", 400);
  act(() => window.dispatchEvent(new Event("resize")));
  expect(dialog.style.width).toBe("304px");
  expect(Number.parseFloat(dialog.style.left) + Number.parseFloat(dialog.style.width)).toBeLessThanOrEqual(312);
  expect(Number.parseFloat(dialog.style.top) + 200).toBeLessThanOrEqual(392);
  vi.stubGlobal("innerWidth", 1024); vi.stubGlobal("innerHeight", 768);
  act(() => window.dispatchEvent(new Event("resize")));
  expect(dialog.style.width).toBe("400px");
});
