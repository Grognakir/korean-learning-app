/** Раскладка иконок рабочего стола — строками, как текст (перенос логики из
 * docs/dev_docs/design/solomon-os/desktop.html без DOM).
 *
 * Модель (сохраняется): строки `{ y, ay: "t" | "b", left, right }`.
 * left — иконки, прилипшие к левому краю (по порядку от края), right — к правому
 * (от края внутрь). gap — сколько пустых клеток перед иконкой (от края или от
 * предыдущей иконки той же стороны); 0 — прилипла к соседу или к краю.
 * При сжатии сначала исчезают зазоры (внутренние — первыми), потом последняя
 * иконка левой стопки переносится на следующую строку к левому краю (если левой
 * стопки нет — внутренняя иконка правой). Перенос считается заново при каждой
 * раскладке, поэтому при растяжении иконки возвращаются. Строки верхней
 * половины держатся верха, нижней — низа. */

export type GridItem = { id: string; gap: number };
export type GridRow = {
  y: number;
  ay: "t" | "b";
  left: GridItem[];
  right: GridItem[];
};
export type GridModel = GridRow[];

export type GridGeometry = {
  cols: number;
  rows: number;
  /** Шаг сетки: размер клетки + общий промежуток. */
  px: number;
  py: number;
  pad: number;
  cw: number;
  ch: number;
};

export type Placement = {
  r: number;
  c: number;
  side: "l" | "r";
  x: number;
  y: number;
};

export const GRID_PAD = 10;

/** Общая сетка: размер иконки постоянный, остаток ширины/высоты (меньше
 * клетки) делится поровну между колонками/строками; крайние — вплотную к краям. */
export function gridGeometry(
  width: number,
  height: number,
  cw: number,
  ch: number,
  pad = GRID_PAD,
): GridGeometry {
  const cols = Math.max(1, Math.floor((width - pad * 2) / cw));
  const rows = Math.max(1, Math.floor((height - pad * 2) / ch));
  const gx = cols > 1 ? (width - pad * 2 - cols * cw) / (cols - 1) : 0;
  const gy = rows > 1 ? (height - pad * 2 - rows * ch) / (rows - 1) : 0;
  return { cols, rows, px: cw + gx, py: ch + gy, pad, cw, ch };
}

export const colX = (g: GridGeometry, c: number) => g.pad + c * g.px;
export const rowY = (g: GridGeometry, r: number) => g.pad + r * g.py;

const rowIndex = (row: GridRow, rows: number) =>
  row.ay === "t" ? row.y : rows - 1 - row.y;

const clone = (m: GridModel): GridModel =>
  m.map((row) => ({
    ...row,
    left: row.left.map((i) => ({ ...i })),
    right: row.right.map((i) => ({ ...i })),
  }));

/** Иконки столбиком у левого края: верхняя половина держится верха, нижняя — низа. */
export function defaultModel(ids: string[], rows: number): GridModel {
  const m: GridRow[] = [];
  ids.forEach((id, i) => {
    const r = i % rows;
    const ay = r > (rows - 1) / 2 ? "b" : "t";
    m[r] ??= { y: ay === "t" ? r : rows - 1 - r, ay, left: [], right: [] };
    m[r].left.push({ id, gap: 0 });
  });
  return m.filter(Boolean);
}

/** Все id есть в модели (иначе модель устарела — новая раскладка по умолчанию). */
export function modelHasAll(
  model: GridModel | null,
  ids: string[],
): model is GridModel {
  if (!Array.isArray(model)) return false;
  const inModel = new Set(
    model.flatMap((row) =>
      [...(row.left ?? []), ...(row.right ?? [])].map((i) => i.id),
    ),
  );
  return ids.every((id) => inModel.has(id));
}

/** Реальные строки и колонки с переносами; модель не меняется. */
export function compute(
  model: GridModel,
  g: GridGeometry,
  skip?: string,
): Record<string, Placement> {
  const { cols, rows } = g;
  const lines = new Map<number, { left: GridItem[]; right: GridItem[] }>();
  const line = (r: number) => {
    if (!lines.has(r)) lines.set(r, { left: [], right: [] });
    return lines.get(r)!;
  };
  for (const row of model) {
    const L = line(Math.min(Math.max(0, rowIndex(row, rows)), rows - 1));
    row.left.forEach((it) => it.id !== skip && L.left.push({ ...it }));
    row.right.forEach((it) => it.id !== skip && L.right.push({ ...it }));
  }
  const out: Record<string, Placement> = {};
  for (let r = 0; lines.size && r <= Math.max(...lines.keys()); r++) {
    const L = lines.get(r);
    if (!L) continue;
    const need = () =>
      L.left.reduce((s, i) => s + i.gap + 1, 0) +
      L.right.reduce((s, i) => s + i.gap + 1, 0);
    // 1) убираем зазоры, начиная с внутренних
    const inner = () => {
      const items: GridItem[] = [];
      for (let k = Math.max(L.left.length, L.right.length) - 1; k >= 0; k--) {
        if (L.left[k]) items.push(L.left[k]);
        if (L.right[k]) items.push(L.right[k]);
      }
      return items;
    };
    while (need() > cols) {
      const withGap = inner().find((i) => i.gap > 0);
      if (!withGap) break;
      withGap.gap--;
    }
    // 2) переносим лишние иконки на следующую строку
    while (need() > cols) {
      const N = line(r + 1);
      if (L.left.length) N.left.unshift({ ...L.left.pop()!, gap: 0 });
      else N.right.push({ ...L.right.pop()!, gap: 0 });
    }
    let c = 0;
    for (const it of L.left) {
      c += it.gap;
      out[it.id] = { r, c, side: "l", x: colX(g, c), y: rowY(g, r) };
      c++;
    }
    c = cols - 1;
    for (const it of L.right) {
      c -= it.gap;
      out[it.id] = { r, c, side: "r", x: colX(g, c), y: rowY(g, r) };
      c--;
    }
  }
  return out;
}

/** Клетка под точкой (координаты левого верхнего угла иконки). */
export function snap(x: number, y: number, g: GridGeometry): [number, number] {
  return [
    Math.min(Math.max(Math.round((x - g.pad) / g.px), 0), g.cols - 1),
    Math.min(Math.max(Math.round((y - g.pad) / g.py), 0), g.rows - 1),
  ];
}

/** Убрать иконку из модели, не сдвигая остальных. */
export function detach(model: GridModel, id: string): GridModel {
  const m = clone(model);
  for (const row of m) {
    for (const side of ["left", "right"] as const) {
      const i = row[side].findIndex((it) => it.id === id);
      if (i < 0) continue;
      const [it] = row[side].splice(i, 1);
      if (row[side][i]) row[side][i].gap += it.gap + 1;
    }
  }
  return m.filter((row) => row.left.length || row.right.length);
}

/** Положить иконку в клетку (c, r): прилипает к соседу слева, иначе к соседу
 * справа, иначе к ближайшему краю. Занятая клетка — сдвигается только
 * сплошная цепочка соседей. */
export function attach(
  model: GridModel,
  id: string,
  c: number,
  r: number,
  g: GridGeometry,
): GridModel {
  const m = clone(model);
  const { cols, rows } = g;
  const cur = compute(m, g, id);
  const inRow = Object.entries(cur)
    .filter(([, p]) => p.r === r)
    .map(([k, p]) => ({ id: k, ...p }));
  const at = (col: number) => inRow.find((p) => p.c === col);
  const side =
    at(c)?.side ??
    at(c - 1)?.side ??
    at(c + 1)?.side ??
    (c > (cols - 1) / 2 ? "r" : "l");
  let list = inRow
    .filter((p) => p.side === side)
    .map((p) => ({ id: p.id, c: p.c }));
  if (side === "l") {
    let k = c;
    while (list.some((p) => p.c === k)) k++;
    list.forEach((p) => {
      if (p.c >= c && p.c < k) p.c++;
    });
  } else {
    let k = c;
    while (list.some((p) => p.c === k)) k--;
    list.forEach((p) => {
      if (p.c <= c && p.c > k) p.c--;
    });
  }
  list.push({ id, c });

  let row = m.find((rw) => rowIndex(rw, rows) === r);
  if (!row) {
    const ay = r > (rows - 1) / 2 ? "b" : "t";
    row = { y: ay === "t" ? r : rows - 1 - r, ay, left: [], right: [] };
    m.push(row);
  }
  const key = side === "l" ? "left" : "right";
  // В строке модели остаются только свои иконки; перенесённые сюда из других
  // строк остаются в своих строках.
  const own = new Set([...row[key].map((i) => i.id), id]);
  // Свои иконки, которые сейчас перенесены на другую строку, — в конце стороны.
  const wrapped = row[key]
    .filter((i) => !list.some((p) => p.id === i.id))
    .map((i) => ({ id: i.id, gap: 0 }));
  list = list.filter((p) => own.has(p.id));
  let prev = side === "l" ? -1 : cols;
  list.sort((p, q) => (side === "l" ? p.c - q.c : q.c - p.c));
  row[key] = list
    .map((p) => {
      const gap = Math.max(0, side === "l" ? p.c - prev - 1 : prev - p.c - 1);
      prev = p.c;
      return { id: p.id, gap };
    })
    .concat(wrapped);
  return m;
}
