import { LoginForm } from "@/features/auth/components/LoginForm";
import { safeNextPath } from "@/features/auth/safeNext";
import { BackHomeLink } from "../BackHomeLink";
import styles from "../auth-layout.module.css";

const NOTICES: Record<string, string> = {
  confirm:
    "Ссылка подтверждения недействительна или уже использована. Войдите или запросите новую.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <main className={styles.wrap}>
      <BackHomeLink />
      <LoginForm notice={error ? NOTICES[error] : undefined} next={safeNextPath(next) === "/" ? undefined : safeNextPath(next)} />
    </main>
  );
}
