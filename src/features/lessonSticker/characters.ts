export type Emotion = "idle" | "blink" | "hover" | "ringing";

export type StickerCharacter = {
  base: string;
  /** Нарисованные эмоции; остальные показываются как idle. */
  emotions: Emotion[];
  alt: string;
};

export const CHARACTERS: Record<string, StickerCharacter> = {
  "jia-call": {
    base: "/images/lesson-sticker/jia-call",
    emotions: ["idle", "blink", "hover", "ringing"],
    alt: "지아 звонит",
  },
};

export function emotionSrc(character: StickerCharacter, emotion: Emotion): string {
  const name = character.emotions.includes(emotion) ? emotion : "idle";
  return `${character.base}/${name}.png`;
}
