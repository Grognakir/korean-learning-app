import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSentence, objectParticle } from "@/features/lessonSticker/clothing/buildSentence";
import { COLORED_BASE, ICON_BASE, ITEM_BY_ID, ITEMS } from "@/features/lessonSticker/clothing/items";
import { COLORS } from "@/features/lessonSticker/clothing/colors";
import { SITUATIONS, TARGETS } from "@/features/lessonSticker/clothing/situations";
import { CHARACTERS } from "@/features/lessonSticker/characters";

const PUBLIC = join(__dirname, "../public");
const manifest: { id: string; ko: string; slot: string; recolorable: boolean; patternable: boolean }[] =
  JSON.parse(readFileSync(join(PUBLIC, ICON_BASE, "manifest.json"), "utf-8"));

describe("каталог одежды", () => {
  it("совпадает с manifest.json иконок", () => {
    expect(ITEMS.map((it) => it.id).sort()).toEqual(manifest.map((m) => m.id).sort());
    for (const m of manifest) {
      const it = ITEM_BY_ID[m.id];
      expect(it.slot).toBe(m.slot);
      expect(it.recolorable).toBe(m.recolorable);
      if (it.patternable) expect(m.patternable, it.id).toBe(true);
      expect(m.ko.split("/")).toContain(it.ko);
    }
  });

  it("у каждой вещи есть иконка, маска ткани (если перекрашивается) и глагол", () => {
    for (const it of ITEMS) {
      expect(existsSync(join(PUBLIC, ICON_BASE, `${it.id}.png`)), it.id).toBe(true);
      expect(existsSync(join(PUBLIC, ICON_BASE, `${it.id}_fabric.png`)), it.id).toBe(it.recolorable);
      expect(it.verbs.length).toBeGreaterThan(0);
    }
  });

  it("у перекрашиваемых вещей есть готовые картинки всех цветов", () => {
    for (const it of ITEMS.filter((i) => i.recolorable))
      for (const c of COLORS)
        expect(existsSync(join(PUBLIC, COLORED_BASE, it.id, `${c.id}.webp`)), `${it.id}/${c.id}`).toBe(true);
  });

  it("ситуации ссылаются только на существующие вещи, аватарки на месте", () => {
    for (const s of SITUATIONS) {
      const ids = [
        ...(s.required ?? []).flatMap((r) => r.anyOf),
        ...(s.forbidden ?? []).flatMap((r) => r.items),
        ...(s.discouraged ?? []).flatMap((r) => r.items),
        ...(s.colors ?? []).flatMap((r) => r.items ?? []),
        ...(s.patterns ?? []).flatMap((r) => r.items ?? []),
        ...s.example.map((p) => p.id),
      ];
      for (const id of ids) expect(ITEM_BY_ID[id], `${s.id}: ${id}`).toBeDefined();
    }
    expect(SITUATIONS).toHaveLength(15);
    for (const t of Object.values(TARGETS)) expect(existsSync(join(PUBLIC, t.avatar)), t.id).toBe(true);
  });

  it("у персонажа стикера есть все картинки эмоций", () => {
    for (const c of Object.values(CHARACTERS)) {
      for (const e of c.emotions) expect(existsSync(join(PUBLIC, c.base, `${e}.png`)), e).toBe(true);
    }
  });
});

describe("buildSentence", () => {
  it("ставит 을/를 по 받침", () => {
    expect(objectParticle("정장")).toBe("을");
    expect(objectParticle("넥타이")).toBe("를");
  });

  it("собирает фразу о наряде с глаголами по вещам", () => {
    const interview = SITUATIONS.find((s) => s.id === "interview")!;
    expect(buildSentence(interview, interview.example)).toBe(
      "저는 남색 정장하고 흰색 블라우스를 입고 검은색 구두를 신어요.",
    );
  });

  it("для старших — почтительная форма, узор в описании", () => {
    const dol = SITUATIONS.find((s) => s.id === "dol")!;
    expect(buildSentence(dol, dol.example)).toBe(
      "아빠는 남색 정장하고 흰색 와이셔츠를 입고 노란색 넥타이를 매고 갈색 구두를 신으세요.",
    );
    const gift = SITUATIONS.find((s) => s.id === "dad-gift")!;
    expect(buildSentence(gift, gift.example)).toBe("아빠께 남색 줄무늬 넥타이를 드려요.");
  });
});
