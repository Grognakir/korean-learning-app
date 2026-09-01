"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { deleteWord, updateWord } from "@/features/dictionary/actions";
import {
  PART_OF_SPEECH_TAGS,
  type CategoryOption,
  type PartOfSpeech,
  type Word,
  type WordDraft,
} from "@/features/dictionary/types";
import { WordEditForm } from "./WordEditForm";
import styles from "./EditWordModal.module.css";

type EditWordModalProps = {
  open: boolean;
  word: Word | null;
  categories: CategoryOption[];
  onClose: () => void;
  onWordChanged: () => void;
};

// Переводов и примечаний в базе может быть несколько строк, а форма
// правки работает с одним полем каждого — склеиваем так же, как их
// показывает карточка слова.
function wordToDraft(word: Word): Partial<WordDraft> {
  const partOfSpeech = (PART_OF_SPEECH_TAGS as readonly string[]).includes(
    word.part_of_speech ?? "",
  )
    ? (word.part_of_speech as PartOfSpeech)
    : null;

  return {
    headword: word.headword,
    reading: word.reading,
    partOfSpeech,
    translation: word.translations.map((t) => t.text).join(", "),
    notes: word.word_notes.map((n) => n.text).join("\n") || null,
    examples: word.word_examples,
    categories: word.word_categories
      .map((wc) => wc.categories?.name)
      .filter((name): name is string => Boolean(name)),
  };
}

export function EditWordModal({
  open,
  word,
  categories,
  onClose,
  onWordChanged,
}: EditWordModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleClose = () => {
    setConfirmingDelete(false);
    setDeleting(false);
    setDeleteError(null);
    onClose();
  };

  const handleSaved = () => {
    handleClose();
    onWordChanged();
  };

  const handleDelete = async () => {
    if (!word) return;
    setDeleteError(null);
    setDeleting(true);

    const result = await deleteWord(word.id);
    setDeleting(false);

    if (result.error) {
      setDeleteError(result.error);
      return;
    }

    handleSaved();
  };

  if (!word) return null;

  const dangerZone = (
    <div className={styles.dangerZone}>
      {confirmingDelete ? (
        <>
          <p className={styles.confirmText}>
            Удалить «{word.headword}» вместе с переводом, примерами и
            примечаниями? Отменить будет нельзя.
          </p>
          <div className={styles.confirmRow}>
            <Button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? "Удаляем…" : "Удалить"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
            >
              Отмена
            </Button>
          </div>
        </>
      ) : (
        <button
          type="button"
          className={styles.deleteButton}
          onClick={() => setConfirmingDelete(true)}
        >
          Удалить слово
        </button>
      )}
      {deleteError && <p className={styles.error}>{deleteError}</p>}
    </div>
  );

  return (
    <Modal open={open} onClose={handleClose} title="Изменить слово">
      <h2 className={styles.title}>Изменить слово</h2>
      <WordEditForm
        key={word.id}
        categories={categories}
        initialDraft={wordToDraft(word)}
        onSave={(draft) => updateWord(word.id, draft)}
        onSaved={handleSaved}
        submitLabel="Сохранить"
        footer={dangerZone}
      />
    </Modal>
  );
}
