"use client";

import { useState, useTransition } from "react";
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
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const select = (value: Language) => {
    if (value === language) return;
    setLanguage(value);
    const formData = new FormData();
    formData.set("language", value);
    startTransition(async () => {
      await updateActiveLanguage(formData);
      router.refresh();
    });
  };

  return (
    <div className={`${styles.root} ${size === "lg" ? styles.rootLg : ""}`} role="tablist">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={language === option.value}
          className={language === option.value ? styles.optionActive : styles.option}
          onClick={() => select(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
