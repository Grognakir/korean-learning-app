import Link from "next/link";
import { TaegeukIcon } from "@/components/icons/TaegeukIcon";
import { EnglishIcon } from "@/components/icons/EnglishIcon";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { getActiveLanguage } from "@/features/language/getActiveLanguage";
import { NAV_SECTIONS } from "./navSections";
import styles from "./GuestHeader.module.css";

const BRAND_ICON = { ko: TaegeukIcon, en: EnglishIcon } as const;

export async function GuestHeader() {
  const language = await getActiveLanguage();
  const Icon = BRAND_ICON[language];

  return (
    <header className={styles.nav}>
      <Icon size={28} className={styles.navFlag} />
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
      <div className={styles.navRight}>
        <LanguageSwitch initialLanguage={language} />
        <Link href="/login" className={styles.navAccount}>
          Войти
        </Link>
      </div>
    </header>
  );
}
