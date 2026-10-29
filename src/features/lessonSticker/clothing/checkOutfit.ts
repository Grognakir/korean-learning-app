import { ITEM_BY_ID, type ClothingItem } from "./items";
import { TARGETS, type OutfitPiece, type Severity, type Situation } from "./situations";

export type CheckResult = {
  result: "ok" | "minor" | "forbidden";
  messages: { severity: Severity; ru: string }[];
};

export const WOMENS = ["dress", "skirt", "blouse", "hanbok"];

function matches(it: ClothingItem, sel: { items?: string[]; slots?: string[] }): boolean {
  return Boolean(sel.items?.includes(it.id) || sel.slots?.includes(it.slot));
}

export function checkOutfit(situation: Situation, outfit: OutfitPiece[]): CheckResult {
  const messages: CheckResult["messages"] = [];
  const add = (severity: Severity, ru: string) => {
    if (!messages.some((m) => m.ru === ru)) messages.push({ severity, ru });
  };
  const pieces = outfit
    .map((p) => ({ piece: p, item: ITEM_BY_ID[p.id] }))
    .filter((x): x is { piece: OutfitPiece; item: ClothingItem } => Boolean(x.item));
  const has = (id: string) => pieces.some((x) => x.item.id === id);
  const target = TARGETS[situation.target];

  if (pieces.length === 0) {
    add("minor", situation.kind === "gift" ? "Выберите подарок." : "Ничего не выбрано.");
    return { result: "minor", messages };
  }

  if (situation.kind === "gift" && pieces.length > 1) {
    add("minor", "Подарок — это одна вещь.");
  }

  if (target.male) {
    const womens = pieces.filter((x) => WOMENS.includes(x.item.id));
    if (womens.length > 0) {
      add("forbidden", `${womens.map((x) => x.item.ko).join(", ")} — это женская одежда!`);
    }
  }

  for (const rule of situation.forbidden ?? []) {
    if (pieces.some((x) => rule.items.includes(x.item.id))) add("forbidden", rule.ru);
  }

  for (const group of situation.required ?? []) {
    if (!group.anyOf.some(has)) add("minor", group.ru);
  }

  if (situation.kind === "outfit") {
    const slots = new Set(pieces.map((x) => x.item.slot));
    const hasFull = slots.has("full");
    if (!hasFull && !(slots.has("top") && slots.has("bottom"))) {
      add(
        "minor",
        slots.has("top")
          ? "Не хватает низа: 바지, 치마…"
          : slots.has("bottom")
            ? "Не хватает верха."
            : "Не хватает одежды: верх и низ или 원피스/정장.",
      );
    }
    if (!pieces.some((x) => x.item.slot === "shoes" && x.item.id !== "socks")) {
      add("minor", "Не забудьте обувь.");
    }
  }

  for (const rule of situation.discouraged ?? []) {
    if (pieces.some((x) => rule.items.includes(x.item.id))) add("minor", rule.ru);
  }

  for (const rule of situation.colors ?? []) {
    const broken = pieces.some(
      (x) =>
        x.item.recolorable &&
        matches(x.item, rule) &&
        ((rule.allowed && !rule.allowed.includes(x.piece.color)) ||
          (rule.banned && rule.banned.includes(x.piece.color))),
    );
    if (broken) add(rule.severity ?? "minor", rule.ru);
  }

  for (const rule of situation.patterns ?? []) {
    const broken = pieces.some(
      (x) => x.item.patternable && matches(x.item, rule) && !rule.allowed.includes(x.piece.pattern),
    );
    if (broken) add(rule.severity ?? "minor", rule.ru);
  }

  const result = messages.some((m) => m.severity === "forbidden")
    ? "forbidden"
    : messages.length > 0
      ? "minor"
      : "ok";
  return { result, messages };
}
