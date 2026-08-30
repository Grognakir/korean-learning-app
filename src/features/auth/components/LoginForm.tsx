"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "../actions";
import styles from "./AuthForm.module.css";

type State = { error?: string } | undefined;

export function LoginForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prevState, formData) => signIn(formData),
    undefined,
  );

  return (
    <div className={styles.panel}>
      <h1 className={styles.title}>Вход</h1>
      <form action={formAction} className={styles.form}>
        <label className={styles.field}>
          <span>Email</span>
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label className={styles.field}>
          <span>Пароль</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </label>
        {state?.error && <p className={styles.error}>{state.error}</p>}
        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "Входим…" : "Войти"}
        </button>
      </form>
      <p className={styles.footer}>
        Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
}
