import { requireUser } from "@/features/auth/requireUser";
import { DictionaryLabClient } from "@/features/solomonOs/dictionary/DictionaryLabClient";
import { fromGrammar, fromPhrase } from "@/features/solomonOs/dictionary/reference";
import type { GrammarPoint, Phrase } from "@/features/dictionary/types";
import grammar from "../../../../content/dictionary/grammar.json";
import phrases from "../../../../content/dictionary/phrases.json";

export const metadata = { title: "7 вариантов словаря — Solomon OS" };
export default async function DictionaryLabPage() {
  const { user } = await requireUser();
  const references = [
    ...grammar.points.slice(0, 2).map((point) => fromGrammar({ ...point, id: point.external_id } as unknown as GrammarPoint)),
    ...phrases.phrases.slice(0, 2).map((phrase) => fromPhrase({ ...phrase, id: phrase.external_id } as unknown as Phrase)),
  ];
  return <DictionaryLabClient userId={user.id} references={references}/>;
}
