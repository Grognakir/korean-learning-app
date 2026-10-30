import { describePiece, describePieceRu } from "../clothing/buildSentence";
import { checkOutfit, WOMENS } from "../clothing/checkOutfit";
import { ITEM_BY_ID } from "../clothing/items";
import { TARGETS, type OutfitPiece, type Situation } from "../clothing/situations";

function hits(situation: Situation, piece: OutfitPiece): boolean {
  const item = ITEM_BY_ID[piece.id];
  const matches = (sel: { items?: string[]; slots?: string[] }) =>
    Boolean(sel.items?.includes(item.id) || sel.slots?.includes(item.slot));

  if (TARGETS[situation.target].male && WOMENS.includes(item.id)) return true;
  if ((situation.forbidden ?? []).some((r) => r.items.includes(item.id))) return true;
  if ((situation.discouraged ?? []).some((r) => r.items.includes(item.id))) return true;
  if (
    item.recolorable &&
    (situation.colors ?? []).some(
      (r) =>
        matches(r) &&
        ((r.allowed && !r.allowed.includes(piece.color)) || (r.banned && r.banned.includes(piece.color))),
    )
  ) {
    return true;
  }
  return (
    item.patternable &&
    (situation.patterns ?? []).some((r) => matches(r) && !r.allowed.includes(piece.pattern))
  );
}

/** Купленные вещи, которые нарушают правила эпизода. */
export function wrongPieces(situation: Situation, outfit: OutfitPiece[]): OutfitPiece[] {
  return outfit.filter((p) => hits(situation, p));
}

export type Verdict = {
  ok: boolean;
  /** Ошибочные покупки: «파란색 운동화, 청바지». */
  wrongKo: string;
  /** То же по-русски для перевода: «кроссовки синего цвета». */
  wrongRu: string;
  /** Пояснения на русском (чего не хватает, что не так). */
  notes: string[];
};

export function judge(situation: Situation, outfit: OutfitPiece[]): Verdict {
  const check = checkOutfit(situation, outfit);
  return {
    ok: check.result === "ok",
    wrongKo: wrongPieces(situation, outfit).map(describePiece).join(", "),
    wrongRu: wrongPieces(situation, outfit).map(describePieceRu).join(", "),
    notes: check.messages.map((m) => m.ru),
  };
}
