import { describe, expect, it } from "vitest";
import { backspace, typeAll, typeJamo } from "@/features/lessonSticker/story/hangul";

describe("сборка слогов на своей клавиатуре", () => {
  it("собирает слова магазина", () => {
    expect(typeAll("", "ㄴㅏㅁㅅㅐㄱ")).toBe("남색");
    expect(typeAll("", "ㅈㅓㅇㅈㅏㅇ")).toBe("정장");
    expect(typeAll("", "ㅈㅓㅇㅈㅏㅇ ㅈㅜㅅㅔㅇㅛ")).toBe("정장 주세요");
    expect(typeAll("", "ㅁㅜㄹㅂㅏㅇㅇㅜㄹㅁㅜㄴㅢ")).toBe("물방울무늬");
    expect(typeAll("", "ㅇㅘㅇㅣㅅㅕㅊㅡ")).toBe("와이셔츠");
  });

  it("받침 переходит в следующий слог, двойной — второй частью", () => {
    expect(typeAll("", "ㄴㅏㅁㅏ")).toBe("나마");
    expect(typeAll("", "ㄷㅏㄹㄱ")).toBe("닭");
    expect(typeAll("", "ㄱㅏㅂㅅㅣ")).toBe("갑시");
  });

  it("сложные гласные и двойные согласные", () => {
    expect(typeAll("", "ㅎㅗㅏ")).toBe("화");
    expect(typeAll("", "ㅇㅡㅣ")).toBe("의");
    expect(typeAll("", "ㅃㅏ")).toBe("빠");
    // ㅃ не бывает 받침 — новая буква.
    expect(typeJamo("가", "ㅃ")).toBe("가ㅃ");
  });

  it("⌫ разбирает слог по одной букве", () => {
    const steps = ["닭"];
    while (steps[steps.length - 1]) steps.push(backspace(steps[steps.length - 1]));
    expect(steps).toEqual(["닭", "달", "다", "ㄷ", ""]);
    expect(backspace("화")).toBe("호");
    expect(backspace("정장 ")).toBe("정장");
  });
});
