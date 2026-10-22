import Link from "next/link";
import { avatarFor } from "@/features/auth/avatar";
import { getAuthUser } from "@/features/auth/requireUser";
import { TaegeukIcon } from "@/components/icons/TaegeukIcon";
import { UserMenu } from "@/components/ui/UserMenu";
import { NAV_SECTIONS } from "./navSections";
import styles from "./AppHeader.module.css";

export async function AppHeader({ username }: { username: string }) {
  const { user } = await getAuthUser();
  const avatar = avatarFor(user?.id ?? username);

  return (
    <header className={styles.header}>
      <Link href="/learning" className={styles.brand}>
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
        <UserMenu username={username} avatar={avatar} />
      </div>
    </header>
  );
}
