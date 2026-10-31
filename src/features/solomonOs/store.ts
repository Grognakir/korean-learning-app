export type OsStore = {
  userId?: string;
  load: <T>(key: string, fallback: T) => T;
  save: (key: string, value: unknown) => void;
  remove: (key: string) => void;
};

const memory = new Map<string, string>();
const failed = new Set<string>();

export function createOsStore(userId?: string, migrateLegacy = true): OsStore {
  const prefix = userId ? `solomon:user:${encodeURIComponent(userId)}:` : "solomon:";
  const read = (key: string) => {
    const full = prefix + key;
    if (failed.has(full)) return memory.get(full) ?? null;
    try {
      let raw = window.localStorage.getItem(full);
      if (raw === null && userId && migrateLegacy && window.localStorage.getItem("solomon:" + key) !== null) {
        const ownerKey = "solomon:legacy-owner";
        let owner = window.localStorage.getItem(ownerKey);
        if (!owner || owner === `${userId}:design-lab`) {
          window.localStorage.setItem(ownerKey, userId);
          owner = userId;
        }
        if (owner === userId) {
          raw = window.localStorage.getItem("solomon:" + key);
          if (raw !== null) window.localStorage.setItem(full, raw);
        }
      }
      return raw;
    } catch {
      return memory.get(full) ?? null;
    }
  };
  return {
    userId,
    load<T>(key: string, fallback: T): T {
      const raw = read(key);
      if (raw == null) return fallback;
      try { return JSON.parse(raw) as T; } catch { return fallback; }
    },
    save(key, value) {
      const full = prefix + key;
      const raw = JSON.stringify(value);
      memory.set(full, raw);
      try {
        window.localStorage.setItem(full, raw);
        failed.delete(full);
      } catch { failed.add(full); }
    },
    remove(key) {
      const full = prefix + key;
      memory.delete(full);
      failed.delete(full);
      try {
        window.localStorage.removeItem(full);
        if (userId && window.localStorage.getItem("solomon:legacy-owner") === userId)
          window.localStorage.removeItem("solomon:" + key);
      } catch {}
    },
  };
}

export const { load, save, remove } = createOsStore();
