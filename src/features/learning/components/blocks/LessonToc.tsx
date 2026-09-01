import Link from "next/link";
import type { Block, LessonTocBlock } from "@/features/learning/types";
import styles from "./blocks.module.css";

function chipAccentClass(
  blockRef: string | null,
  blockTypeById: Record<string, Block["type"]>,
): string | undefined {
  if (!blockRef) return undefined;
  const type = blockTypeById[blockRef];
  if (!type) return undefined;
  if (type === "grammar_point" || type === "grammar_exercise") {
    return styles.chipGrammar;
  }
  return styles.chipContent;
}

export function LessonToc({
  block,
  lessonNumber,
  blockTypeById,
}: {
  block: LessonTocBlock;
  lessonNumber: number;
  blockTypeById: Record<string, Block["type"]>;
}) {
  return (
    <div className={styles.block}>
      {block.sections.map((section) => (
        <div key={section.key} className={styles.tocSection}>
          <span className={`${styles.tocKey} kr`}>{section.key}</span>
          <div className={styles.tocItems}>
            {section.items.map((item, itemIndex) => {
              const accent = chipAccentClass(item.block_ref, blockTypeById);
              if (item.block_ref) {
                // Первое упражнение раздела — без #якоря, чтобы открыть
                // раздел с верха (словарь и т.п.), а не прыгать сразу на блок.
                const isFirstLinked =
                  itemIndex ===
                  section.items.findIndex((entry) => entry.block_ref != null);
                const href = isFirstLinked
                  ? `/learning/plans/${lessonNumber}/${encodeURIComponent(section.key)}`
                  : `/learning/plans/${lessonNumber}/${encodeURIComponent(section.key)}#${item.block_ref}`;
                return (
                  <Link
                    key={item.label}
                    href={href}
                    className={`${styles.chip} ${styles.chipLink} ${accent ?? ""} kr`}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <span
                  key={item.label}
                  className={`${styles.chip} kr`}
                  title="Скоро"
                >
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
