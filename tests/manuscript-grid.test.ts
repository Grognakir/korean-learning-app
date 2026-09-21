import { describe, expect, it } from "vitest";
import { layoutManuscript } from "@/features/learning/components/blocks/manuscriptGrid";

describe("layoutManuscript", () => {
  it("дополняет каждую строку до полной ширины пустыми клетками", () => {
    const rows = layoutManuscript("가", 20);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveLength(20);
    expect(rows[0][0]).toEqual({ char: "", caretIndex: 0 });
    expect(rows[0][1]).toEqual({ char: "가", caretIndex: 0 });
    for (let i = 2; i < 20; i++) {
      expect(rows[0][i]).toEqual({ char: "", caretIndex: 1 });
    }
  });

  it("клетка-отступ абзаца указывает на начало реального текста этого абзаца", () => {
    const text = "가\n나";
    const rows = layoutManuscript(text, 20);
    expect(rows).toHaveLength(2);
    // отступ первой строки и сам первый слог указывают на index 0
    expect(rows[0][0].caretIndex).toBe(0);
    expect(rows[0][1]).toEqual({ char: "가", caretIndex: 0 });
    // хвост первой строки указывает сразу после "가" (до переноса строки)
    expect(rows[0][2].caretIndex).toBe(1);
    // второй абзац начинается после "\n" (index 2 в сыром тексте)
    expect(rows[1][0].caretIndex).toBe(2);
    expect(rows[1][1]).toEqual({ char: "나", caretIndex: 2 });
    // хвост второй строки указывает на конец текста
    expect(rows[1][2].caretIndex).toBe(text.length);
  });

  it("пара цифр занимает одну клетку и верно считает сырой индекс дальше", () => {
    const rows = layoutManuscript("123", 20);
    expect(rows[0][0]).toEqual({ char: "", caretIndex: 0 });
    expect(rows[0][1]).toEqual({ char: "12", caretIndex: 0 });
    expect(rows[0][2]).toEqual({ char: "3", caretIndex: 2 });
    expect(rows[0][3].caretIndex).toBe(3);
  });

  it("знак препинания, который открыл бы новую строку, прижимается к последней клетке предыдущей", () => {
    const rows = layoutManuscript("나.", 2);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual([
      { char: "", caretIndex: 0 },
      { char: "나.", caretIndex: 0 },
    ]);
  });
});
