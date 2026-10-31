"use client";

import type { OsStore } from "../store";
import { useOsStore } from "../OsStorage";
import styles from "../SolomonOs.module.css";

/** Настройки из макета: версия и сброс расположения иконок, окон и переписки. */
export function Settings() {
  const store = useOsStore();
  return (
    <div className={`${styles.pad} kr`}>
      <h4>설정</h4>
      Solomon OS v0.1
      <br />
      <span className={styles.dim}>
        Расположение иконок и окон сохраняется в браузере.
      </span>
      <br />
      <button
        type="button"
        className={styles.btn}
        onClick={() => {
          resetLayout(store);
          window.location.reload();
        }}
      >
        Сбросить расположение
      </button>
    </div>
  );
}

export function Locked() {
  return (
    <div className={`${styles.lockbox} kr`}>
      <div>
        <b>🔒</b>
        잠겨 있어요.
        <br />
        <small>Откроется по сюжету.</small>
      </div>
    </div>
  );
}

export function resetLayout(store: OsStore) {
  ["icons3", "windows"].forEach(store.remove);
}
