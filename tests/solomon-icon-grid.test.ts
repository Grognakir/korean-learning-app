import { describe, expect, it } from "vitest";
import {
  attach,
  compute,
  defaultModel,
  detach,
  gridGeometry,
  withApps,
  snap,
  type GridModel,
} from "@/features/solomonOs/iconGrid";

const CW = 92;
const CH = 96;
/** Ширина рабочего стола на n колонок (отступы по 10px). */
const width = (cols: number, extra = 0) => 20 + cols * CW + extra;
const geo = (cols: number, rows = 6, extra = 0) => gridGeometry(width(cols, extra), 20 + rows * CH, CW, CH);
const cells = (m: GridModel, cols: number, rows = 6) =>
  Object.fromEntries(Object.entries(compute(m, geo(cols, rows))).map(([id, p]) => [id, [p.r, p.c]]));

describe("сетка иконок Solomon OS", () => {
  it("общий шаг: остаток ширины делится поровну, крайние колонки у краёв", () => {
    const g = geo(4, 6, 60);
    expect(g.cols).toBe(4);
    expect(g.px).toBeCloseTo(CW + 20);
    const p = compute([{ y: 0, ay: "t", left: [{ id: "a", gap: 0 }], right: [{ id: "b", gap: 0 }] }], g);
    expect(p.a.x).toBe(10);
    expect(p.b.x + CW).toBeCloseTo(width(4, 60) - 10);
  });

  it("по умолчанию — столбик у левого края, нижняя половина держится низа", () => {
    const m = defaultModel(["a", "b", "c", "d"], 4);
    expect(cells(m, 5, 4)).toEqual({ a: [0, 0], b: [1, 0], c: [2, 0], d: [3, 0] });
    expect(m.map((r) => r.ay)).toEqual(["t", "t", "b", "b"]);
  });

  it("новое приложение не сбрасывает расстановку: новая иконка — в свободную строку", () => {
    const saved: GridModel = [
      { y: 0, ay: "t", left: [], right: [{ id: "b", gap: 0 }] },
      { y: 0, ay: "b", left: [{ id: "a", gap: 2 }, { id: "old", gap: 0 }], right: [] },
    ];
    const m = withApps(saved, ["a", "b", "c"], 4);
    expect(cells(m, 5, 4)).toEqual({ b: [0, 4], a: [3, 2], c: [1, 0] });
    expect(withApps(null, ["a", "b"], 4)).toEqual(defaultModel(["a", "b"], 4));
  });

  it("при сужении сначала исчезают зазоры, потом иконка переносится; при расширении возвращается", () => {
    const m: GridModel = [
      { y: 0, ay: "t", left: [{ id: "a", gap: 0 }, { id: "b", gap: 2 }, { id: "c", gap: 0 }], right: [] },
    ];
    expect(cells(m, 6)).toEqual({ a: [0, 0], b: [0, 3], c: [0, 4] });
    // 4 колонки: зазор сжался до 1
    expect(cells(m, 4)).toEqual({ a: [0, 0], b: [0, 2], c: [0, 3] });
    // 3 колонки: зазоров нет
    expect(cells(m, 3)).toEqual({ a: [0, 0], b: [0, 1], c: [0, 2] });
    // 2 колонки: последняя иконка левой стопки — на следующую строку к левому краю
    expect(cells(m, 2)).toEqual({ a: [0, 0], b: [0, 1], c: [1, 0] });
    // 1 колонка: переносы каскадом
    expect(cells(m, 1)).toEqual({ a: [0, 0], b: [1, 0], c: [2, 0] });
    // обратно шире — всё на своих местах, модель не менялась
    expect(cells(m, 6)).toEqual({ a: [0, 0], b: [0, 3], c: [0, 4] });
  });

  it("без левой стопки переносится внутренняя иконка правой", () => {
    const m: GridModel = [{ y: 0, ay: "t", left: [], right: [{ id: "x", gap: 0 }, { id: "y", gap: 0 }] }];
    expect(cells(m, 2)).toEqual({ x: [0, 1], y: [0, 0] });
    expect(cells(m, 1)).toEqual({ x: [0, 0], y: [1, 0] });
  });

  it("положить иконку: прилипает к соседу слева, к правому краю, сдвигает только сплошную цепочку", () => {
    const g = geo(6);
    let m: GridModel = [{ y: 0, ay: "t", left: [{ id: "a", gap: 0 }, { id: "b", gap: 0 }], right: [] }];
    m = [...m, { y: 1, ay: "t", left: [{ id: "c", gap: 0 }], right: [] }];
    // c в клетку (0, 3): сосед слева пуст, справа пуст → ближе к левому краю, с зазором 1 после b
    let n = attach(detach(m, "c"), "c", 3, 0, g);
    expect(cells(n, 6)).toEqual({ a: [0, 0], b: [0, 1], c: [0, 3] });
    // в правую половину пустой строки — прилипает к правому краю
    n = attach(detach(m, "c"), "c", 5, 2, g);
    expect(cells(n, 6).c).toEqual([2, 5]);
    // в занятую клетку (0, 0): a и b сдвигаются вправо
    n = attach(detach(m, "c"), "c", 0, 0, g);
    expect(cells(n, 6)).toEqual({ c: [0, 0], a: [0, 1], b: [0, 2] });
  });

  it("убрать иконку не сдвигает соседей", () => {
    const m: GridModel = [{ y: 0, ay: "t", left: [{ id: "a", gap: 0 }, { id: "b", gap: 0 }, { id: "c", gap: 1 }], right: [] }];
    expect(cells(detach(m, "b"), 6)).toEqual({ a: [0, 0], c: [0, 3] });
  });

  it("клетка под точкой ограничена сеткой", () => {
    const g = geo(4, 3);
    expect(snap(-50, -50, g)).toEqual([0, 0]);
    expect(snap(10 + g.px * 2.4, 10 + g.py * 0.6, g)).toEqual([2, 1]);
    expect(snap(5000, 5000, g)).toEqual([3, 2]);
  });
});
