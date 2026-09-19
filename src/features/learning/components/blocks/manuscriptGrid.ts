// 원고지 (корейская тетрадь "в клетку" для сочинений) — раскладка текста по
// сетке фиксированной ширины (COLS) по традиционным правилам:
// - первая клетка каждого абзаца (после переноса строки) остаётся пустой (отступ);
// - один слог/буква/пробел — одна клетка;
// - до двух цифр — в одной клетке (двумя парами, с конца никогда не начиная);
// - знак препинания не может быть первым символом новой строки — если строка
//   кончилась ровно на последнем слоге, знак прижимается к последней клетке
//   предыдущей строки (в той же клетке, что и последний слог), а не уходит
//   в начало следующей.

export const MANUSCRIPT_COLS = 20;

const PUNCTUATION = new Set([".", ",", "!", "?", ";", ":", "'", '"', "…", "·", ")", "]", "}"]);

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/[0-9]/.test(ch)) {
      let digits = ch;
      i++;
      if (i < text.length && /[0-9]/.test(text[i])) {
        digits += text[i];
        i++;
      }
      tokens.push(digits);
      continue;
    }
    tokens.push(ch);
    i++;
  }
  return tokens;
}

export function layoutManuscript(text: string, cols: number = MANUSCRIPT_COLS): string[][] {
  const paragraphs = text.split("\n");
  const rows: string[][] = [];
  let current: string[] = [];

  function wrap() {
    rows.push(current);
    current = [];
  }

  function place(token: string) {
    if (current.length === 0 && rows.length > 0 && PUNCTUATION.has(token)) {
      // Знак не может открывать новую строку — прижимаем к последней
      // клетке предыдущей строки вместо начала новой.
      const prevRow = rows[rows.length - 1];
      prevRow[prevRow.length - 1] += token;
      return;
    }
    current.push(token);
    if (current.length === cols) wrap();
  }

  paragraphs.forEach((paragraph, pIndex) => {
    if (pIndex > 0) {
      if (current.length > 0) wrap();
    }
    place(""); // отступ первого абзаца строки
    for (const token of tokenize(paragraph)) place(token);
  });

  if (current.length > 0) rows.push(current);
  return rows;
}
