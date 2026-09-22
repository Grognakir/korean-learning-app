"use client";

import { useEffect } from "react";

// Единственное место, которое ловит ошибку самого корневого layout.tsx —
// обычный error.tsx его не перехватывает (документированное ограничение
// Next.js App Router). Без этого файла сбой в layout (например,
// getAuthUser()/getProfileRow() не достучались до Supabase) рендерит
// пустую страницу без единого пикселя разметки — и на iPad, где
// приложение открыто как standalone PWA без адресной строки, обновить
// её нечем, только закрыть и открыть заново.
//
// Рендерится ВМЕСТО всего дерева, включая исходный <html>/<body> — стили
// из globals.css могли не подгрузиться, поэтому только инлайн и только
// захардкоженные значения токенов (--paper/--ink/--ink-soft/--blue/
// --radius-control из src/styles/tokens.css), а не var(...).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#faf6ee",
          color: "#1c1b19",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 360, textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
            Что-то пошло не так
          </p>
          <p style={{ fontSize: 14, color: "#57534a", margin: "0 0 20px" }}>
            Приложение не смогло загрузиться. Попробуйте ещё раз.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              border: "none",
              borderRadius: 12,
              padding: "12px 22px",
              background: "#1f4e8c",
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  );
}
