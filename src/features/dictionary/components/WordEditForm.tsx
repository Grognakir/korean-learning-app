"use client";

import { useState, type ReactNode } from "react";
import {
  PART_OF_SPEECH_LABELS,
} from "@/features/dictionary/partOfSpeechLabels";
import {
  PART_OF_SPEECH_TAGS,
  type CategoryOption,
  type WordDraft,
} from "@/features/dictionary/types";
import { Button } from "@/components/ui/Button";
import { MultiSelect, Select } from "@/components/ui/Select";
import styles from "./WordEditForm.module.css";

type WordEditFormProps = {
  categories: CategoryOption[];
  initialDraft?: Partial<WordDraft>;
  onSave: (draft: WordDraft) => Promise<{ error?: string; success?: true }>;
  onSaved: () => void;
  submitLabel?: string;
  footer?: ReactNode;
};

const emptyExample = { kr: "", ru: "" };

function buildInitialState(initialDraft?: Partial<WordDraft>) {
  return {
    headword: initialDraft?.headword ?? "",
    reading: initialDraft?.reading ?? "",
    partOfSpeech: initialDraft?.partOfSpeech ?? "",
    translation: initialDraft?.translation ?? "",
    notes: initialDraft?.notes ?? "",
    examples:
      initialDraft?.examples && initialDraft.examples.length > 0
        ? initialDraft.examples
        : [{ ...emptyExample }],
    selectedCategories: new Set(initialDraft?.categories ?? []),
    customCategory: "",
    correctedFrom: initialDraft?.correctedFrom,
    isNewCategory: initialDraft?.isNewCategory ?? false,
  };
}

export function WordEditForm({
  categories,
  initialDraft,
  onSave,
  onSaved,
  submitLabel = "Добавить",
  footer,
}: WordEditFormProps) {
  const [state, setState] = useState(() => buildInitialState(initialDraft));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addExample = () => {
    setState((prev) => ({
      ...prev,
      examples: [...prev.examples, { ...emptyExample }],
    }));
  };

  const updateExample = (
    index: number,
    field: "kr" | "ru",
    value: string,
  ) => {
    setState((prev) => ({
      ...prev,
      examples: prev.examples.map((ex, i) =>
        i === index ? { ...ex, [field]: value } : ex,
      ),
    }));
  };

  const removeExample = (index: number) => {
    setState((prev) => ({
      ...prev,
      examples:
        prev.examples.length > 1
          ? prev.examples.filter((_, i) => i !== index)
          : prev.examples,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const categoryList = [
      ...state.selectedCategories,
      ...(state.customCategory.trim() ? [state.customCategory.trim()] : []),
    ];

    const draft: WordDraft = {
      headword: state.headword.trim(),
      reading: state.reading.trim() || null,
      partOfSpeech: state.partOfSpeech
        ? (state.partOfSpeech as WordDraft["partOfSpeech"])
        : null,
      translation: state.translation.trim(),
      notes: state.notes.trim() || null,
      examples: state.examples.filter((ex) => ex.kr.trim() || ex.ru.trim()),
      categories: categoryList,
    };

    const result = await onSave(draft);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onSaved();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {state.correctedFrom && (
        <p className={styles.correctedBanner}>
          Вы ввели «{state.correctedFrom}» — похоже, это опечатка, исправлено
          на «<span className="kr">{state.headword}</span>»
        </p>
      )}

      <label className={styles.field}>
        <span className={styles.label}>Слово</span>
        <input
          className={`${styles.input} kr`}
          value={state.headword}
          onChange={(e) =>
            setState((prev) => ({ ...prev, headword: e.target.value }))
          }
          required
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Транслитерация</span>
        <input
          className={styles.input}
          value={state.reading}
          onChange={(e) =>
            setState((prev) => ({ ...prev, reading: e.target.value }))
          }
        />
      </label>

      <div className={styles.field}>
        <span className={styles.label}>Часть речи</span>
        <Select
          aria-label="Часть речи"
          value={state.partOfSpeech}
          onChange={(v) =>
            setState((prev) => ({ ...prev, partOfSpeech: v }))
          }
          options={[
            { value: "", label: "Не указано" },
            ...PART_OF_SPEECH_TAGS.map((tag) => ({
              value: tag,
              label: PART_OF_SPEECH_LABELS[tag],
            })),
          ]}
        />
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Перевод</span>
        <input
          className={styles.input}
          value={state.translation}
          onChange={(e) =>
            setState((prev) => ({ ...prev, translation: e.target.value }))
          }
          required
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Примечания</span>
        <textarea
          className={styles.textarea}
          value={state.notes}
          onChange={(e) =>
            setState((prev) => ({ ...prev, notes: e.target.value }))
          }
          rows={2}
        />
      </label>

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>Примеры</legend>
        <ul className={styles.examplesList}>
          {state.examples.map((ex, i) => (
            <li key={i} className={styles.exampleRow}>
              <input
                className={`${styles.input} kr`}
                placeholder="Корейский"
                value={ex.kr}
                onChange={(e) => updateExample(i, "kr", e.target.value)}
              />
              <input
                className={styles.input}
                placeholder="Перевод"
                value={ex.ru}
                onChange={(e) => updateExample(i, "ru", e.target.value)}
              />
              {state.examples.length > 1 && (
                <button
                  type="button"
                  className={styles.removeExample}
                  onClick={() => removeExample(i)}
                  aria-label="Удалить пример"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
        <button type="button" className={styles.addExample} onClick={addExample}>
          + пример
        </button>
      </fieldset>

      <div className={styles.fieldset}>
        <span className={styles.label}>Категории</span>
        <MultiSelect
          aria-label="Категории"
          values={[...state.selectedCategories]}
          onChange={(values) =>
            setState((prev) => ({
              ...prev,
              selectedCategories: new Set(values),
            }))
          }
          placeholder="Выбрать категории"
          options={[
            ...categories.map((cat) => ({
              value: cat.name,
              label: cat.name,
            })),
            ...[...state.selectedCategories]
              .filter((name) => !categories.some((c) => c.name === name))
              .map((name) => ({ value: name, label: name })),
          ]}
        />
        <div className={styles.customCategoryRow}>
          <input
            className={styles.input}
            placeholder="Своя категория"
            value={state.customCategory}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                customCategory: e.target.value,
              }))
            }
          />
          {state.isNewCategory && (
            <span className={styles.newCategoryChip}>новая категория</span>
          )}
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Сохраняем…" : submitLabel}
      </Button>

      {footer}
    </form>
  );
}
