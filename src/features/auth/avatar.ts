export type Avatar = { emoji: string; background: string };

const AVATARS: Avatar[] = [
  { emoji: "🦊", background: "#f6dcc4" },
  { emoji: "🐼", background: "#e4e7ec" },
  { emoji: "🐯", background: "#f7e3b5" },
  { emoji: "🐰", background: "#f3d9e2" },
  { emoji: "🐻", background: "#e6d3c1" },
  { emoji: "🐱", background: "#f1e2cf" },
  { emoji: "🦉", background: "#dfe3d0" },
  { emoji: "🐧", background: "#d5e2ee" },
  { emoji: "🐸", background: "#d6e8cf" },
  { emoji: "🦄", background: "#e5dcf2" },
];

/** Иконка пользователя: «случайная», но одна и та же для одного и того же seed (FNV-1a). */
export function avatarFor(seed: string): Avatar {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return AVATARS[(hash >>> 0) % AVATARS.length];
}
