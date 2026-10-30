"use client";

import { remove } from "../store";
import styles from "../SolomonOs.module.css";

/** Настройки из макета: версия и сброс расположения иконок, окон и переписки. */
export function Settings() {
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
          ["icons3", "windows", "chat"].forEach(remove);
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
