import { RegisterForm } from "@/features/auth/components/RegisterForm";
import styles from "../auth-layout.module.css";

export default function RegisterPage() {
  return (
    <main className={styles.wrap}>
      <RegisterForm />
    </main>
  );
}
