import styles from "./blocks.module.css";

// "가"/"나" — обезличенные ролевые метки шаблонного диалога, а не имена
// персонажей: их красим как в grammar_exercise (dialogueSpeakerA/B,
// синий/янтарный, без выравнивающего min-width) — иначе через общий
// .speaker (только синий + min-width 44px под длинные имена вроде
// "로빈"/"아멜리") у короткого "가"/"나" получается неуместно большой
// отступ перед текстом.
export function speakerClassName(speaker: string): string {
  if (speaker === "가") return styles.dialogueSpeakerA;
  if (speaker === "나") return styles.dialogueSpeakerB;
  return styles.speaker;
}
