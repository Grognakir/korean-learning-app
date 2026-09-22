import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Manuscript } from "@/features/learning/components/blocks/Manuscript";

afterEach(() => vi.unstubAllGlobals());

describe("Manuscript", () => {
  it("ставит курсор после символа выбранной клетки", () => {
    render(<Manuscript rows={1} />);

    const textarea = screen.getByRole("textbox", { name: "Текст сочинения" });
    fireEvent.change(textarea, { target: { value: "가나", selectionStart: 2 } });

    fireEvent.click(screen.getByText("가"));
    expect(textarea).toHaveProperty("selectionStart", 1);
    expect(textarea).toHaveProperty("selectionEnd", 1);

    fireEvent.click(screen.getByText("나"));
    expect(textarea).toHaveProperty("selectionStart", 2);
    expect(textarea).toHaveProperty("selectionEnd", 2);
  });

  it("на мобильном сохраняет 400 клеток в сетке 10 на 40", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    const { container } = render(<Manuscript />);

    await waitFor(() => {
      const grid = container.querySelector<HTMLElement>("[style*='--manuscript-columns: 10']");
      expect(grid?.children).toHaveLength(40);
      expect(grid?.firstElementChild?.children).toHaveLength(10);
    });
  });
});
