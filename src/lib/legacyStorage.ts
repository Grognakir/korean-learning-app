/**
 * Чтение значения из localStorage по ключу пользователя с переносом старых
 * (до разделения по аккаунтам) данных: их забирает первый вошедший
 * пользователь, остальным они не показываются. Владелец фиксируется в
 * `ownerKey`; если записать владельца не удалось, старые данные не
 * отдаются — иначе их мог бы получить любой следующий аккаунт.
 */
export function readWithLegacy(
  fullKey: string,
  legacyKey: string,
  ownerKey: string,
  userId: string | undefined,
): string | null {
  const raw = window.localStorage.getItem(fullKey);
  if (raw !== null || !userId || fullKey === legacyKey) return raw;

  const legacy = window.localStorage.getItem(legacyKey);
  if (legacy === null) return null;
  const owner = window.localStorage.getItem(ownerKey);
  if (owner && owner !== userId) return null;
  if (!owner) {
    try {
      window.localStorage.setItem(ownerKey, userId);
    } catch {
      return null;
    }
  }
  try {
    window.localStorage.setItem(fullKey, legacy);
  } catch {
    // значение всё равно отдаём: владелец уже записан
  }
  return legacy;
}

export function scopedKey(base: string, userId: string | undefined): string {
  return userId ? `user:${userId}:${base}` : base;
}
