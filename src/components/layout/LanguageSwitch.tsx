"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateActiveLanguage } from "@/features/settings/actions";
import type { Language } from "@/features/dictionary/types";
import styles from "./LanguageSwitch.module.css";

const OPTIONS: { value: Language; label: string }[] = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
];

export function LanguageSwitch({
  initialLanguage,
  size = "sm",
}: {
  initialLanguage: Language;
  size?: "sm" | "lg";
}) {
  const [language, setLanguage] = useOptimistic(initialLanguage);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const select = (value: Language) => {
    if (value === language || pending) return;
    setError(null);
    const formData = new FormData();
    formData.set("language", value);
    startTransition(async () => {
      setLanguage(value);
      try {
        const result = await updateActiveLanguage(formData);
        if (result.error) {
          setError("Не удалось переключить язык. Попробуйте ещё раз.");
          return;
        }
        router.refresh();
      } catch {
        setError("Не удалось переключить язык. Проверьте соединение и повторите.");
      }
    });
  };

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.root} ${size === "lg" ? styles.rootLg : ""}`}
        role="tablist"
        aria-label="Язык обучения"
        aria-busy={pending}
      >
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={language === option.value}
            className={language === option.value ? styles.optionActive : styles.option}
            disabled={pending}
            onClick={() => select(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
