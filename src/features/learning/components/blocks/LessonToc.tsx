import Link from "next/link";
import type { Block, LessonTocBlock } from "@/features/learning/types";
import { LabelInfo } from "./LabelInfo";
import styles from "./blocks.module.css";

const SECTION_TYPE_RU: Record<string, string> = {
  준비하기: "Подготовка",
  말하기: "Говорение",
  "듣고 말하기": "Аудирование и говорение",
  "읽고 말하기": "Чтение и говорение",
  쓰기: "Письмо",
  "문화 이해하기": "Культура",
};

function sectionTypeTranslation(key: string): string {
  const base = key.replace(/\s*\d+$/, "");
  return SECTION_TYPE_RU[base] ?? base;
}

export function LessonToc({
  block,
  textbookSlug,
  lessonNumber,
  blockTypeById,
}: {
  block: LessonTocBlock;
  textbookSlug: string;
  lessonNumber: number;
  blockTypeById: Record<string, Block["type"]>;
}) {
  return (
    <div className={styles.block}>
      {block.sections.map((section) => {
        const [heading, ...subItems] = section.items;
        const isAvailable = section.items.some((item) => item.block_ref != null);
        const openHref = `/learning/plans/${textbookSlug}/${lessonNumber}/${encodeURIComponent(section.key)}`;

        return (
          <div key={section.key} className={styles.tocRow}>
            <div className={styles.tocRowMain}>
              <div className={styles.tocRowText}>
                <span className={styles.tocRowHeading}>
                  <span className={`${styles.tocKey} kr`}>{section.key}</span>
                  <LabelInfo translation={sectionTypeTranslation(section.key)} />
                </span>
                {heading && (
                  <span className={styles.tocRowSubtitle}>
                    <span className="kr">{heading.label}</span>
                    {heading.label_ru && <LabelInfo translation={heading.label_ru} />}
                  </span>
                )}
              </div>
              {isAvailable ? (
                <Link href={openHref} className={styles.tocRowAction}>
                  Открыть →
                </Link>
              ) : (
                <span className={styles.tocRowSoon}>Скоро</span>
              )}
            </div>

            {isAvailable && subItems.length > 0 && (
              <div className={styles.tocItems}>
                {subItems.map((item) => {
                  const type = item.block_ref ? blockTypeById[item.block_ref] : undefined;
                  const accent =
                    type === "grammar_point" || type === "grammar_exercise"
                      ? styles.chipGrammar
                      : styles.chipContent;
                  if (!item.block_ref) {
                    return (
                      <span key={item.label} className={`${styles.chip} kr`} title="Скоро">
                        {item.label}
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={item.label}
                      href={`${openHref}#${item.block_ref}`}
                      className={`${styles.chip} ${styles.chipLink} ${accent} kr`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
