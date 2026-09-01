import Link from "next/link";
import { signOut } from "@/features/auth/actions";
import { SettingsIcon } from "@/components/icons/SettingsIcon";
import { TaegeukIcon } from "@/components/icons/TaegeukIcon";
import { UserMenu } from "@/components/ui/UserMenu";
import { NAV_SECTIONS } from "./navSections";
import styles from "./AppHeader.module.css";

export function AppHeader({ username }: { username: string }) {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        <TaegeukIcon size={22} />
        <span>한국어 공부</span>
      </Link>
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
      <div className={styles.headerRight}>
        <div className={styles.headerActions}>
          <span className={styles.userMenu} title="Скоро — меню профиля">
            {username} ▾
          </span>
          <Link href="/settings" className={styles.iconButton} title="Настройки">
            <SettingsIcon />
          </Link>
          <form action={signOut}>
            <button type="submit" className={styles.logout}>
              Выйти
            </button>
          </form>
        </div>
        <UserMenu username={username} />
      </div>
    </header>
  );
}
