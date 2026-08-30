"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  generateWordDraftAction,
  saveWord,
} from "@/features/dictionary/actions";
import type { CategoryOption, WordDraft } from "@/features/dictionary/types";
import { WordEditForm } from "./WordEditForm";
import styles from "./AddWordModal.module.css";

type AddWordModalProps = {
  open: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  onWordAdded: () => void;
};

export function AddWordModal({
  open,
  onClose,
  categories,
  onWordAdded,
}: AddWordModalProps) {
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [aiInput, setAiInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [draft, setDraft] = useState<WordDraft | null>(null);

  const handleClose = () => {
    setAiInput("");
    setAiError(null);
    setDraft(null);
    setGenerating(false);
    onClose();
  };

  const handleGenerate = async () => {
    setAiError(null);
    setDraft(null);
    setGenerating(true);

    const result = await generateWordDraftAction(aiInput);
    setGenerating(false);

    if (result.error) {
      setAiError(result.error);
      return;
    }

    if (result.draft) {
      setDraft(result.draft);
    }
  };

  const handleSaved = () => {
    handleClose();
    onWordAdded();
  };

  const handleSave = (wordDraft: WordDraft) => saveWord(wordDraft);

  return (
    <Modal open={open} onClose={handleClose} title="Добавить слово">
      <h2 className={styles.title}>Добавить слово</h2>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "ai"}
          className={mode === "ai" ? styles.tabActive : styles.tab}
          onClick={() => setMode("ai")}
        >
          Через AI
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "manual"}
          className={mode === "manual" ? styles.tabActive : styles.tab}
          onClick={() => setMode("manual")}
        >
          Вручную
        </button>
      </div>

      {mode === "ai" && (
        <div className={styles.aiSection}>
          <div className={styles.aiRow}>
            <input
              className={styles.aiInput}
              placeholder="Слово на корейском или по-русски"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleGenerate();
                }
              }}
            />
            <Button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={generating || !aiInput.trim()}
            >
              {generating ? "…" : "Сгенерировать"}
            </Button>
          </div>

          {aiError && <p className={styles.error}>{aiError}</p>}

          {draft && (
            <WordEditForm
              categories={categories}
              initialDraft={draft}
              onSave={handleSave}
              onSaved={handleSaved}
            />
          )}
        </div>
      )}

      {mode === "manual" && (
        <WordEditForm
          categories={categories}
          onSave={handleSave}
          onSaved={handleSaved}
        />
      )}
    </Modal>
  );
}
