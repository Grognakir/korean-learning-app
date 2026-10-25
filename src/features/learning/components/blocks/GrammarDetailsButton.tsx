"use client";

import { useCallback, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { GrammarPointDetails } from "@/features/dictionary/components/GrammarPointDetails";
import { GRAMMAR_COLUMNS } from "@/features/dictionary/grammarColumns";
import type { GrammarPoint } from "@/features/dictionary/types";
import { createClient } from "@/lib/supabase/client";
import styles from "./blocks.module.css";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; point: GrammarPoint };

// «Изучить подробнее»: открывает модальное окно с полным описанием конструкции
// из словаря. variant "summary" стоит в строке заголовка (не должна сворачивать
// блок), "footer" — под объяснением.
export function GrammarDetailsButton({
  pattern,
  variant,
}: {
  pattern: string;
  variant: "summary" | "footer";
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>({ status: "idle" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const { data, error } = await createClient()
      .from("grammar_points")
      .select(GRAMMAR_COLUMNS)
      .eq("pattern", pattern)
      .is("owner_user_id", null)
      .limit(1);
    const point = (data?.[0] ?? null) as GrammarPoint | null;
    setState(error || !point ? { status: "error" } : { status: "ready", point });
  }, [pattern]);

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
        className={
          variant === "summary"
            ? `${styles.grammarDetailsAction} ${styles.grammarDetailsActionTop}`
            : styles.grammarDetailsAction
        }
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
          <GrammarPointDetails point={state.point} />
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
