import Link from "next/link";
import { TaegeukIcon } from "@/components/icons/TaegeukIcon";
import { NAV_SECTIONS } from "./navSections";
import styles from "./GuestHeader.module.css";

export function GuestHeader() {
  return (
    <header className={styles.nav}>
      <TaegeukIcon size={28} className={styles.navFlag} />
      <nav className={styles.navCenter} aria-label="Разделы приложения">
        {NAV_SECTIONS.map(({ label, href }) =>
          href ? (
            <Link key={label} href={href} className={styles.navLink}>
              {label}
            </Link>
          ) : (
            <span key={label} className={styles.navStub} title="Скоро">
              {label}
            </span>
          ),
        )}
      </nav>
      <Link href="/login" className={styles.navAccount}>
        Войти
      </Link>
    </header>
  );
}
