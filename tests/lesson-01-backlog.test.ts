// @vitest-environment node
import { readLessonSource } from "../scripts/lib/lesson-source";
import { join } from "node:path";
import { expect, it } from "vitest";

type Block = {
  id?: string;
  source_note?: string;
  explanation?: string;
  details_link?: { label: string; href: string | null };
  rules?: string[];
  items?: { ko: string; translation_ru: string }[];
  extra_words?: Record<string, { ko: string; translation_ru: string }[]>;
  vocab?: { ko: string; translation_ru: string }[];
  example?: {
    dialogue?: string[];
    emphasis?: string[][];
    vocab?: { ko: string; translation_ru: string }[];
  };
};

const lesson = readLessonSource(join(process.cwd(), "content/reference/inha_book_content/2급_lesson_01/lesson-01.json")) as { pages: { blocks: Block[] }[] };
const blocks = lesson.pages.flatMap((page) => page.blocks);
const byId = (id: string) => blocks.find((block) => block.id === id)!;

it("оставляет в рукописном словаре только подтверждённые слова", () => {
  const vocab = byId("vocab-junbihagi1");

  expect(vocab.items?.map((item) => item.ko)).toEqual(["개월", "앞으로", "지내다", "자세하다"]);
  expect(vocab.source_note).not.toContain("слова из упражнений");
});

it("уточняет правила грамматики первого раздела", () => {
  const naming = byId("grammar-1");
  const elapsed = byId("grammar-3");

  expect(naming.rules).toEqual([
    "Нет 받침 → N라고 하다\n**디마라고 해요**",
    "Есть 받침 → N이라고 하다\n**학생이라고 해요**",
    "Пересказ уже сказанного → N(이)라고 했어요",
    "Вопрос «как называется?» → 뭐라고 해요?",
    "Работает со всеми временами (과거, 현재, 미래) и предположением",
  ]);
  expect(naming.explanation).toContain("**Смысл:**");
  expect(naming.details_link).toEqual({ label: "Изучить подробнее", href: null });
  expect(elapsed.rules).toEqual([
    "Нет 받침 → -ㄴ 지\n**오다 → 온 지**",
    "Есть 받침 → -은 지\n**먹다 → 먹은 지**",
    "Строится по схеме → AV-(으)ㄴ 지 + время + {{되다|исполниться, стать (о сроке)}} / {{지나다|пройти, миновать}} / {{넘다|перевалить, быть больше}}",
    "Работает со всеми временами (과거, 현재, 미래) и предположением",
  ]);
});

it("выделяет грамматический каркас, а не целые изменяемые слова", () => {
  expect(byId("exercise-1a").example?.emphasis).toEqual([
    ["처음 뵙겠습니다. 저는", "이라고 합니다", "에서 왔어요"],
    ["안녕하세요? 저는", "에서 온", "라고 합니다"],
  ]);
  expect(byId("exercise-2a").example?.emphasis).toEqual([["으니까", "게", "세요"]]);
  expect(byId("exercise-2b").example?.emphasis).toEqual([
    ["를 어떻게", "를 거예요"],
    ["니까", "게", "려고 해요"],
  ]);
  expect(byId("exercise-3a").example?.emphasis).toEqual([
    ["저는", "온 지", "이 됐어요.", "씨는요?"],
    ["전", "온 지", "이 지났어요."],
  ]);
});

it("хранит переводы слов примеров в дополнительных словах vocab_list", () => {
  const known = new Set(
    blocks
      .filter((block) => block.items && !block.rules)
      .flatMap((block) => [
        ...(block.items ?? []).map((item) => item.ko),
        ...Object.values(block.extra_words ?? {}).flat().map((item) => item.ko),
      ]),
  );
  for (const ko of ["목소리", "너무", "작다", "크다", "건강", "짜다", "말다", "머리", "요즘", "짧다", "자르다", "자를", "더우", "쉽다", "설명하다", "주셨", "추우", "옷", "따뜻하다", "입다", "드", "맛있다", "드릴", "차갑다"]) {
    expect(known.has(ko), ko).toBe(true);
  }
  expect(byId("exercise-2a").example?.vocab).toBeUndefined();
  expect(byId("grammar-2").vocab).toBeUndefined();
});

// Регресс: фрагмент "이라고 합니다" был скопирован в обе строки exercise-1a,
// но 아멜리 (без받침) на самом деле спрягается в "라고 합니다" (без 이) —
// text.indexOf() такой фрагмент не находил, и вся фраза оставалась
// невыделенной. Проверяем, что каждый emphasis-фрагмент реально встречается
// в своей строке диалога, а не просто "похож на правильный".
it("каждый emphasis-фрагмент реально встречается в своей строке диалога", () => {
  for (const id of ["exercise-1a", "exercise-2a", "exercise-2b", "exercise-3a"]) {
    const example = byId(id).example!;
    example.emphasis?.forEach((fragments, lineIndex) => {
      const line = example.dialogue![lineIndex];
      for (const fragment of fragments) {
        expect(line.includes(fragment), `"${fragment}" не найден в "${line}" (${id})`).toBe(true);
      }
    });
  }
});
