import styles from "./blocks.module.css";

// Название блока (문법/연습하기/표현/단어 и т.п.) — фиксированный небольшой
// набор терминов, а не учебный текст, поэтому перевод виден сразу, а не
// по наведению/клику как у LabelInfo.
export function LabelTranslation({ translation }: { translation: string }) {
  return <span className={styles.labelTranslation}>{translation}</span>;
}
