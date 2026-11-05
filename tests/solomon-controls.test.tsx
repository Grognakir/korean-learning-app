import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { OsSelect } from "@/features/solomonOs/controls/OsSelect";

function Fixture() {
  const [value, setValue] = useState("a");
  return <><OsSelect label="Свой список" value={value} options={[{ value: "a", label: "Первый" }, { value: "b", label: "Второй" }, { value: "c", label: "Третий" }]} onChange={setValue}/><button type="button">Снаружи</button></>;
}
describe("Кастомный список Solomon OS", () => {
  it("нет native select, список выбирает значение и возвращает фокус", () => {
    const { container } = render(<Fixture/>);
    expect(container.querySelector("select, datalist")).toBeNull();
    const trigger = screen.getByRole("combobox", { name: "Свой список" });
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBe(document.activeElement);
    fireEvent.click(screen.getByRole("option", { name: "Второй" }));
    expect(trigger.textContent).toContain("Второй");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
  it("стрелки, Home/End, ввод буквы и Escape", () => {
    render(<Fixture/>);
    const trigger = screen.getByRole("combobox");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "End" });
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Enter" });
    expect(trigger.textContent).toContain("Третий");
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Home" });
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "ArrowDown" });
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Enter" });
    expect(trigger.textContent).toContain("Второй");
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "П" });
    fireEvent.keyDown(screen.getByRole("listbox"), { key: " " });
    expect(trigger.textContent).toContain("Первый");
    fireEvent.click(trigger); fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
  it("нажатие снаружи закрывает список без изменения выбора", () => {
    render(<Fixture/>); fireEvent.click(screen.getByRole("combobox"));
    fireEvent.pointerDown(screen.getByRole("button", { name: "Снаружи" }));
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByRole("combobox").textContent).toContain("Первый");
  });
});
