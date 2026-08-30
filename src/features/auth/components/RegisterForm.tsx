"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "../actions";
import styles from "./AuthForm.module.css";

type State = { error?: string; success?: true } | undefined;

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prevState, formData) => signUp(formData),
    undefined,
  );

  if (state?.success) {
    return (
      <div className={styles.panel}>
        <h1 className={styles.title}>Проверьте почту</h1>
        <p className={styles.notice}>
          Мы отправили письмо со ссылкой для подтверждения регистрации.
          Перейдите по ней, чтобы войти.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h1 className={styles.title}>Регистрация</h1>
      <form action={formAction} className={styles.form}>
        <label className={styles.field}>
          <span>Имя</span>
          <input
            type="text"
            name="username"
            required
            minLength={2}
            maxLength={32}
            autoComplete="nickname"
          />
        </label>
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
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        {state?.error && <p className={styles.error}>{state.error}</p>}
        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "Регистрируем…" : "Зарегистрироваться"}
        </button>
      </form>
      <p className={styles.footer}>
        Уже есть аккаунт? <Link href="/login">Войти</Link>
      </p>
    </div>
  );
}
