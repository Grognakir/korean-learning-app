"use client";

import { useEffect } from "react";
import Link from "next/link";
import buttons from "@/components/ui/Button.module.css";
import styles from "./error.module.css";

// Перехватывает ошибки рендера любой страницы/вложенного layout ниже
// корневого (тот отдельно ловит только global-error.tsx). До этого файла
// такого сбоя не показывало вообще ничего вменяемого. Кнопка зовёт retry(),
// а не reset(): reset только перерисовывает уже упавший серверный результат
// и потому «ничего не делает», retry заново запрашивает страницу на сервере.
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.wrap}>
      <p className={styles.title}>Что-то пошло не так</p>
      <p className={styles.subtitle}>Попробуйте ещё раз или вернитесь на главную.</p>
      <div className={styles.actions}>
        <button type="button" className={buttons.primary} onClick={() => retry()}>
          Попробовать снова
        </button>
        <Link href="/" className={buttons.secondary}>
          На главную
        </Link>
      </div>
    </div>
  );
}
