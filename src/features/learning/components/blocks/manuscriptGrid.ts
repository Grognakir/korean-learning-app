// 원고지 (корейская тетрадь "в клетку" для сочинений) — раскладка текста по
// сетке фиксированной ширины (COLS) по традиционным правилам:
// - первая клетка каждого абзаца (после переноса строки) остаётся пустой (отступ);
// - один слог/буква/пробел — одна клетка;
// - до двух цифр — в одной клетке (двумя парами, с конца никогда не начиная);
// - знак препинания не может быть первым символом новой строки — если строка
//   кончилась ровно на последнем слоге, знак прижимается к последней клетке
//   предыдущей строки (в той же клетке, что и последний слог), а не уходит
//   в начало следующей.
//
// Каждая клетка несёт индексы начала и конца в исходном сыром тексте
// (значении hidden-textarea). При клике курсор встаёт в конец клетки:
// поэтому Backspace удаляет символ, по которому кликнули.
// Отступ абзаца не продвигает счётчик — поэтому его caretIndex естественно
// совпадает с началом реального текста абзаца: кликнуть по нему — то же
// самое, что кликнуть по первой содержательной клетке, вписать в саму
// клетку-отступ ничего нельзя. Пустые клетки-заполнители (ещё не
// напечатанный хвост строки/абзаца/весь текст) указывают на ближайшую
// разумную точку продолжения письма (конец абзаца или конец текста).

export const MANUSCRIPT_COLS = 20;

const PUNCTUATION = new Set([".", ",", "!", "?", ";", ":", "'", '"', "…", "·", ")", "]", "}"]);

export type ManuscriptCell = {
  char: string;
  caretIndex: number;
  caretAfterIndex: number;
};

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

export function layoutManuscript(
  text: string,
  cols: number = MANUSCRIPT_COLS,
): ManuscriptCell[][] {
  const paragraphs = text.split("\n");
  const rows: ManuscriptCell[][] = [];
  let current: ManuscriptCell[] = [];
  let rawIndex = 0;

  function padRow(row: ManuscriptCell[], caretIndex: number) {
    while (row.length < cols) row.push({ char: "", caretIndex, caretAfterIndex: caretIndex });
  }

  function wrap() {
    padRow(current, rawIndex);
    rows.push(current);
    current = [];
  }

  function place(char: string, caretIndex: number) {
    if (current.length === 0 && rows.length > 0 && PUNCTUATION.has(char)) {
      // Знак не может открывать новую строку — прижимаем к последней
      // клетке предыдущей строки вместо начала новой (caretIndex этой
      // клетки не трогаем — он остаётся у исходного слога, не у знака).
      const prevRow = rows[rows.length - 1];
      prevRow[prevRow.length - 1].char += char;
      prevRow[prevRow.length - 1].caretAfterIndex = caretIndex + char.length;
      return;
    }
    current.push({ char, caretIndex, caretAfterIndex: caretIndex + char.length });
    if (current.length === cols) wrap();
  }

  paragraphs.forEach((paragraph, pIndex) => {
    if (pIndex > 0) {
      if (current.length > 0) wrap();
      rawIndex += 1; // перенос строки между абзацами тоже символ сырого текста
    }
    place("", rawIndex); // отступ первого абзаца строки
    for (const token of tokenize(paragraph)) {
      place(token, rawIndex);
      rawIndex += token.length;
    }
  });

  if (current.length > 0) {
    padRow(current, rawIndex);
    rows.push(current);
  }

  return rows;
}
