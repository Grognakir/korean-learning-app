import { LoginForm } from "@/features/auth/components/LoginForm";
import styles from "../auth-layout.module.css";

export default function LoginPage() {
  return (
    <main className={styles.wrap}>
      <LoginForm />
    </main>
  );
}
