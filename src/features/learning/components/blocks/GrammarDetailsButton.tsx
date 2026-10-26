"use client";

import { useCallback, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { GrammarPointDetails } from "@/features/dictionary/components/GrammarPointDetails";
import { GRAMMAR_COLUMNS } from "@/features/dictionary/grammarColumns";
import type { GrammarPoint } from "@/features/dictionary/types";
import type { GrammarPointBlock } from "@/features/learning/types";
import { createClient } from "@/lib/supabase/client";
import styles from "./blocks.module.css";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; point: GrammarPoint; fromLesson: boolean };

// Статьи в словаре нет (или не загрузилась) — показываем то, что написано в самом уроке.
function pointFromBlock(block: GrammarPointBlock): GrammarPoint {
  return {
    id: block.id ?? block.pattern,
    pattern: block.pattern,
    short_desc: null,
    category: "",
    grammar_group: null,
    lesson_label: null,
    lessons: null,
    explanation: block.explanation,
    usage: null,
    rules: block.rules ?? null,
    examples: block.examples.map((kr) => ({ kr, ru: "" })),
    vocab: null,
    notes: block.rules_table
      ? [
          {
            title: "Правила",
            section: true,
            blocks: [{ type: "table", head: block.rules_table.head, rows: block.rules_table.rows }],
          },
        ]
      : null,
    owner_user_id: null,
  };
}

// «Изучить подробнее»: открывает модальное окно с полным описанием конструкции
// из словаря. variant "summary" стоит в строке заголовка (не должна сворачивать
// блок; на планшетах и телефонах скрыта), "footer" — под объяснением в раскрытом
// блоке (видна только на планшетах и телефонах), "standalone" — у блока без
// раскрывающегося объяснения.
export function GrammarDetailsButton({
  block,
  dictionaryRef,
  variant,
}: {
  block: GrammarPointBlock;
  dictionaryRef: string | null;
  variant: "summary" | "footer" | "standalone";
}) {
  const pattern = block.pattern;
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>({ status: "idle" });

  const load = useCallback(async () => {
    if (!dictionaryRef) {
      setState({ status: "ready", point: pointFromBlock(block), fromLesson: true });
      return;
    }
    setState({ status: "loading" });
    const { data, error } = await createClient()
      .from("grammar_points")
      .select(GRAMMAR_COLUMNS)
      .eq("external_id", dictionaryRef)
      .is("owner_user_id", null)
      .limit(1);
    const point = (data?.[0] ?? null) as GrammarPoint | null;
    if (error) setState({ status: "error" });
    else if (point) setState({ status: "ready", point, fromLesson: false });
    else setState({ status: "ready", point: pointFromBlock(block), fromLesson: true });
  }, [block, dictionaryRef]);

  const handleOpen = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
    if (state.status === "idle" || state.status === "error") void load();
  };

  return (
    <>
      <button
        type="button"
        className={`${styles.grammarDetailsAction} ${
          variant === "summary"
            ? styles.grammarDetailsActionTop
            : variant === "footer"
              ? styles.grammarDetailsActionFooter
              : ""
        }`}
        onClick={handleOpen}
      >
        Изучить подробнее
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={pattern}
        heading={<span className="kr">{pattern}</span>}
        reading
      >
        {state.status === "ready" ? (
          <>
            {state.fromLesson && (
              <p className={styles.grammarModalHint}>
                Отдельной статьи в словаре пока нет — показано описание из урока.
              </p>
            )}
            <GrammarPointDetails point={state.point} />
          </>
        ) : state.status === "error" ? (
          <p className={styles.grammarModalHint}>
            Не удалось загрузить описание.{" "}
            <button type="button" className={styles.grammarModalRetry} onClick={() => void load()}>
              Повторить
            </button>
          </p>
        ) : (
          <p className={styles.grammarModalHint}>Загружаем…</p>
        )}
      </Modal>
    </>
  );
}
