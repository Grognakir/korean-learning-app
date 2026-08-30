"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "@/features/auth/actions";
import styles from "./UserMenu.module.css";

export function UserMenu({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initial = username.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Меню профиля"
      >
        {initial}
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <p className={styles.menuUsername}>{username}</p>
          <button
            type="button"
            className={styles.menuItem}
            disabled
            title="Скоро — настройки"
          >
            Настройки
          </button>
          <form action={signOut}>
            <button type="submit" className={styles.menuItemDanger}>
              Выйти
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
