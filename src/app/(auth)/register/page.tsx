import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { BackHomeLink } from "../BackHomeLink";
import styles from "../auth-layout.module.css";

export default function RegisterPage() {
  return (
    <main className={styles.wrap}>
      <BackHomeLink />
      <RegisterForm />
    </main>
  );
}
