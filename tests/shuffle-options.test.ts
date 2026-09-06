import { expect, it, vi } from "vitest";
import { shuffleOptions } from "@/features/trainers/topics/shuffleOptions";
import type { TopicQuizQuestion } from "@/features/trainers/topics/types";

it("меняет положение правильного ответа, сохраняя исходные вопросы и варианты", () => {
  const random = vi.spyOn(Math, "random").mockReturnValue(0);
  try {
    const question: TopicQuizQuestion = { id: "one", topic: "test", question_text: "Вопрос", before_text: null, after_text: null, correct: "A", options: ["A", "B", "C", "D"], translation_ru: null, hint: null };
    const [shuffled] = shuffleOptions([question]);
    expect(shuffled.options).toEqual(["B", "C", "D", "A"]);
    expect(shuffled.correct).toBe("A");
    expect(question.options).toEqual(["A", "B", "C", "D"]);
  } finally { random.mockRestore(); }
});
