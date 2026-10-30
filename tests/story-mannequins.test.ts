import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ITEM_BY_ID } from "@/features/lessonSticker/clothing/items";
import { INTERVIEW_EPISODE } from "@/features/lessonSticker/story/interviewEpisode";
import {
  mannequinSrc,
  ZONE_BOXES,
  ZONE_BY_INDEX,
  zoneItems,
  ZONES,
  zonesSrc,
} from "@/features/lessonSticker/story/mannequins";

const PUBLIC = join(__dirname, "../public");

describe("манекены магазина", () => {
  it("картинки и карты зон на месте, у всех зон есть подписи", () => {
    for (const kind of ["male", "female"] as const) {
      expect(existsSync(join(PUBLIC, mannequinSrc(kind)))).toBe(true);
      expect(existsSync(join(PUBLIC, zonesSrc(kind)))).toBe(true);
      for (const zone of Object.keys(ZONE_BOXES[kind])) expect(ZONES[zone as keyof typeof ZONES], zone).toBeDefined();
    }
    expect(ZONE_BY_INDEX.filter(Boolean)).toHaveLength(Object.keys(ZONES).length);
  });

  it("вещи зон существуют, у каждой зоны женского манекена есть товар", () => {
    for (const zone of Object.values(ZONES)) for (const id of zone.items) expect(ITEM_BY_ID[id], id).toBeDefined();
    for (const zone of Object.keys(ZONE_BOXES.female)) {
      expect(zoneItems("female", zone as keyof typeof ZONES, INTERVIEW_EPISODE.assortment).length, zone).toBeGreaterThan(0);
    }
    expect(zoneItems("male", "top", INTERVIEW_EPISODE.assortment)).not.toContain("blouse");
  });
});
