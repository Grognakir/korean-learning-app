import { describe, expect, it } from "vitest";
import { checkOutfit } from "@/features/lessonSticker/clothing/checkOutfit";
import { SITUATIONS, type OutfitPiece } from "@/features/lessonSticker/clothing/situations";

const byId = (id: string) => SITUATIONS.find((s) => s.id === id)!;
const p = (id: string, color: OutfitPiece["color"] = "white", pattern: OutfitPiece["pattern"] = "plain") => ({
  id,
  color,
  pattern,
});

describe("checkOutfit", () => {
  it.each(SITUATIONS.map((s) => [s.id, s] as const))("эталон «%s» проходит", (_, situation) => {
    expect(checkOutfit(situation, situation.example)).toEqual({ result: "ok", messages: [] });
  });

  it("반바지 на 면접 — грубая ошибка", () => {
    const res = checkOutfit(byId("interview"), [
      p("jacket", "navy"),
      p("blouse"),
      p("shorts", "navy"),
      p("dress_shoes", "black"),
    ]);
    expect(res.result).toBe("forbidden");
  });

  it("яркий 정장 на 면접 — мелкая ошибка", () => {
    const res = checkOutfit(byId("interview"), [p("suit", "red"), p("blouse"), p("dress_shoes", "black")]);
    expect(res.result).toBe("minor");
  });

  it("яркий цвет и 꽃무늬 на 장례식", () => {
    expect(checkOutfit(byId("funeral"), [p("dress", "pink"), p("dress_shoes", "black")]).result).toBe(
      "forbidden",
    );
    expect(
      checkOutfit(byId("funeral"), [p("dress", "black", "floral"), p("dress_shoes", "black")]).result,
    ).toBe("minor");
  });

  it("원피스 для мужчины — грубая ошибка", () => {
    const res = checkOutfit(byId("date"), [p("dress", "navy"), p("sneakers")]);
    expect(res.result).toBe("forbidden");
  });

  it("не хватает низа и обуви", () => {
    const res = checkOutfit(byId("hospital"), [p("tshirt", "gray")]);
    expect(res.result).toBe("minor");
    expect(res.messages.map((m) => m.ru)).toEqual(
      expect.arrayContaining(["Не хватает низа: 바지, 치마…", "Не забудьте обувь."]),
    );
  });

  it("подарок — одна вещь из нужных", () => {
    expect(checkOutfit(byId("grandma-gift"), [p("gloves", "brown")]).result).toBe("ok");
    expect(checkOutfit(byId("grandma-gift"), [p("tie")]).result).toBe("minor");
    expect(checkOutfit(byId("mom-gift"), [p("scarf", "pink", "dots")]).result).toBe("minor");
  });
});
