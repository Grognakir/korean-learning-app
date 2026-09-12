// Ответ засчитывается независимо от финальной точки и лишних пробелов —
// проверяем грамматику, а не пунктуацию.
export function normalizeAnswer(text: string): string {
  return text.normalize("NFC").replace(/\s+/g, " ").trim().replace(/[\s.!?…]+$/, "");
}

export function checkAnswer(answers: string[], input: string): boolean {
  const yours = normalizeAnswer(input);
  return yours !== "" && answers.some((answer) => normalizeAnswer(answer) === yours);
}
