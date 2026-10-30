import { existsSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { checkOutfit } from "@/features/lessonSticker/clothing/checkOutfit";
import { ITEM_BY_ID } from "@/features/lessonSticker/clothing/items";
import { INTERVIEW_EPISODE } from "@/features/lessonSticker/story/interviewEpisode";
import { parsePurchase } from "@/features/lessonSticker/story/parsePurchase";
import { StoryGame } from "@/features/lessonSticker/story/StoryGame";
import { poseSrc } from "@/features/lessonSticker/story/types";
import { judge } from "@/features/lessonSticker/story/verdict";

const { assortment, rules } = INTERVIEW_EPISODE;
const PUBLIC = join(__dirname, "../public");

describe("parsePurchase", () => {
  it("понимает цвет, синонимы и узор", () => {
    expect(parsePurchase("까만 정장 주세요", assortment)).toEqual({
      kind: "ok",
      piece: { id: "suit", color: "black", pattern: "plain" },
    });
    expect(parsePurchase("하얀색 와이셔츠를 주세요", assortment)).toEqual({
      kind: "ok",
      piece: { id: "dress_shirt", color: "white", pattern: "plain" },
    });
    expect(parsePurchase("남색 줄무늬 넥타이", assortment)).toEqual({
      kind: "ok",
      piece: { id: "tie", color: "navy", pattern: "stripes" },
    });
    expect(parsePurchase("검은색 양복", assortment)).toMatchObject({ piece: { id: "suit", color: "black" } });
  });

  it("просит цвет, если его нет, и не знает чужих вещей", () => {
    expect(parsePurchase("구두 주세요", assortment)).toEqual({ kind: "needColor", id: "dress_shoes" });
    expect(parsePurchase("빨간색 원피스 주세요", assortment)).toEqual({ kind: "unknown" });
    expect(parsePurchase("Чёрный костюм, пожалуйста", assortment)).toEqual({ kind: "foreign", lang: "ru" });
    expect(parsePurchase("black suit please", assortment)).toEqual({ kind: "foreign", lang: "en" });
  });
});

describe("эпизод «собеседование»", () => {
  it("у всех поз есть картинки, ассортимент существует", () => {
    for (const step of INTERVIEW_EPISODE.steps) {
      if (step.type === "line") expect(existsSync(join(PUBLIC, poseSrc(step.who, step.pose))), step.pose).toBe(true);
    }
    for (const pose of ["smile", "thinking", "bow"]) expect(existsSync(join(PUBLIC, poseSrc("clerk", pose)))).toBe(true);
    for (const pose of ["happy", "angry", "facepalm"]) expect(existsSync(join(PUBLIC, poseSrc("jia", pose)))).toBe(true);
    for (const id of assortment) expect(ITEM_BY_ID[id], id).toBeDefined();
    expect(existsSync(join(PUBLIC, INTERVIEW_EPISODE.background!))).toBe(true);
  });

  it("эталонный набор проходит, ошибки перечисляются", () => {
    expect(checkOutfit(rules, rules.example).result).toBe("ok");
    const bad = judge(rules, [
      { id: "suit", color: "navy", pattern: "plain" },
      { id: "dress_shirt", color: "white", pattern: "plain" },
      { id: "tie", color: "red", pattern: "plain" },
      { id: "jeans", color: "white", pattern: "plain" },
      { id: "sneakers", color: "blue", pattern: "plain" },
    ]);
    expect(bad.ok).toBe(false);
    expect(bad.wrongKo).toBe("청바지, 파란색 운동화");
  });
});

describe("StoryGame", () => {
  it("проходит путь от звонка до магазина на манекенах и вердикта", () => {
    render(<StoryGame episode={INTERVIEW_EPISODE} progressKey="test-interview" />);
    fireEvent.click(screen.getByRole("button", { name: "[ START ]" }));

    // Реплики и ответы до магазина
    for (let guard = 0; guard < 40 && !screen.queryByLabelText("Корзина"); guard++) {
      const next = screen.queryByRole("button", { name: "▶ 다음" });
      if (next) fireEvent.click(next);
      else fireEvent.click(within(screen.getByRole("group", { name: "Ваш ответ" })).getAllByRole("button")[0]);
    }
    expect(screen.getByText(/뭘 드릴까요\?/)).toBeTruthy();

    // Манекен → зона → вещь на полке → окно-примерочная → цвет → «주세요»
    fireEvent.click(screen.getByRole("button", { name: "남성: 겉옷" }));
    fireEvent.click(screen.getByRole("button", { name: /정장/ }));
    const palette = screen.getByRole("dialog", { name: "Цвет: 정장" });
    expect((within(palette).getByRole("button", { name: "주세요" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(palette).getByRole("button", { name: /남색/ }));
    fireEvent.click(within(palette).getByRole("button", { name: "주세요" }));
    expect(screen.queryByRole("dialog", { name: "Цвет: 정장" })).toBeNull();
    expect(screen.getByText("네, 남색 정장 여기 있어요.")).toBeTruthy();

    // На мужском манекене нет женских вещей
    fireEvent.click(screen.getByRole("button", { name: "남성: 상의" }));
    expect(screen.queryByRole("button", { name: /블라우스/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "여성: 상의" }));
    expect(screen.getByRole("button", { name: /블라우스/ })).toBeTruthy();

    // Ввод фразы текстом
    fireEvent.click(screen.getByRole("button", { name: "Закрыть полку" }));
    fireEvent.click(screen.getByTitle("Написать фразу самому"));
    fireEvent.change(screen.getByLabelText("Что купить"), { target: { value: "구두 주세요" } });
    fireEvent.click(screen.getByRole("button", { name: "Enter" }));
    expect(screen.getByText("구두요? 무슨 색으로 드릴까요?")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "계산할게요" }));
    fireEvent.click(screen.getByRole("button", { name: "▶ 다음" }));
    fireEvent.click(screen.getByRole("button", { name: "▶ 다음" }));
    expect(screen.getByText(/뭘 산 거예요/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "▶ 다음" }));
    fireEvent.click(screen.getByRole("button", { name: "▶ 다음" }));
    fireEvent.click(screen.getByRole("button", { name: "가게로 돌아가기" }));
    expect(screen.getByText("다시 오셨네요! 뭘 드릴까요?")).toBeTruthy();
  });
});
