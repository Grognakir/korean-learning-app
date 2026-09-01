import { LoginForm } from "@/features/auth/components/LoginForm";
import styles from "../auth-layout.module.css";

const NOTICES: Record<string, string> = {
  confirm:
    "Ссылка подтверждения недействительна или уже использована. Войдите или запросите новую.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className={styles.wrap}>
      <LoginForm notice={error ? NOTICES[error] : undefined} />
    </main>
  );
}
