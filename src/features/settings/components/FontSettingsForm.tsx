"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFontPreferences } from "@/features/settings/actions";
import {
  FONT_KR_OPTIONS,
  FONT_UI_OPTIONS,
  fontKrCssVar,
  fontUiCssVar,
} from "@/features/settings/fontOptions";
import { Select } from "@/components/ui/Select";
import styles from "./FontSettingsForm.module.css";

function applyFontCss(fontUi: string | null, fontKr: string | null) {
  const uiVar = fontUiCssVar(fontUi);
  const krVar = fontKrCssVar(fontKr);
  if (uiVar) document.documentElement.style.setProperty("--font-ui-active", uiVar);
  else document.documentElement.style.removeProperty("--font-ui-active");
  if (krVar) document.documentElement.style.setProperty("--font-kr-active", krVar);
  else document.documentElement.style.removeProperty("--font-kr-active");
}

export function FontSettingsForm({
  initialFontUi,
  initialFontKr,
}: {
  initialFontUi: string | null;
  initialFontKr: string | null;
}) {
  const [fontUi, setFontUi] = useState(initialFontUi);
  const [fontKr, setFontKr] = useState(initialFontKr);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const persist = (nextUi: string | null, nextKr: string | null) => {
    setError(null);
    applyFontCss(nextUi, nextKr);
    const formData = new FormData();
    if (nextUi) formData.set("fontUi", nextUi);
    if (nextKr) formData.set("fontKr", nextKr);
    startTransition(async () => {
      const result = await updateFontPreferences(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <section className={styles.root}>
      <h2 className={styles.sectionTitle}>Настройки шрифта интерфейса</h2>

      <div className={styles.fields}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Шрифт интерфейса</span>
          <Select
            value={fontUi ?? ""}
            onChange={(v) => {
              const next = v || null;
              setFontUi(next);
              persist(next, fontKr);
            }}
            aria-label="Шрифт интерфейса"
            options={[
              {
                value: "",
                label: "Системный",
                preview: "Привет, Hello",
              },
              ...FONT_UI_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
                preview: "Привет, Hello",
                previewStyle: { fontFamily: o.cssVar },
              })),
            ]}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Корейский шрифт</span>
          <Select
            value={fontKr ?? ""}
            onChange={(v) => {
              const next = v || null;
              setFontKr(next);
              persist(fontUi, next);
            }}
            aria-label="Корейский шрифт"
            options={[
              {
                value: "",
                label: "Системный",
                preview: "안녕하세요",
                previewClassName: "kr",
              },
              ...FONT_KR_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
                preview: "안녕하세요",
                previewClassName: "kr",
                previewStyle: { fontFamily: o.cssVar },
              })),
            ]}
          />
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}
