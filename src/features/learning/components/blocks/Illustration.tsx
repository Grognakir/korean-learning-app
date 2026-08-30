import type { IllustrationBlock } from "@/features/learning/types";
import styles from "./blocks.module.css";

export function Illustration({
  block,
  id,
}: {
  block: IllustrationBlock;
  id?: string;
}) {
  return (
    <div id={id} className={styles.block}>
      {block.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.imageUrl}
          alt={block.caption}
          className={styles.illustrationImage}
        />
      ) : (
        <div className={styles.illustrationPlaceholder}>
          Иллюстрация появится позже
        </div>
      )}
      <span className={styles.caption}>{block.caption}</span>
    </div>
  );
}
