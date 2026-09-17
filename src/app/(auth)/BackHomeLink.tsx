import Link from "next/link";
import styles from "./auth-layout.module.css";

export function BackHomeLink() {
  return (
    <Link href="/" className={styles.back} aria-label="На главную" title="На главную">
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M9.5 3 4.5 8l5 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
