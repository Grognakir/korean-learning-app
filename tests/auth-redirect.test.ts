import { afterEach, describe, expect, it, vi } from "vitest";
import { safeNextPath } from "@/features/auth/safeNext";
import { authErrorMessage, AUTH_FALLBACK_ERROR } from "@/features/auth/errorMessages";
import { siteOrigin } from "@/features/auth/siteUrl";
import { LESSON_SECTION_KEYS, decodeSectionKey, isKnownLesson, isKnownSection, isKnownTextbook } from "@/features/learning/lessonRegistry";

afterEach(() => vi.unstubAllEnvs());

describe("безопасный путь возврата после входа", () => {
  it("пропускает внутренний путь с query и hash", () => {
    expect(safeNextPath("/learning/programs/inha-2/14?a=1#x")).toBe("/learning/programs/inha-2/14?a=1#x");
  });
  it.each([
    ["абсолютный URL", "https://evil.example/x"],
    ["//host", "//evil.example"],
    ["/\\host", "/\\evil.example"],
    ["табуляция", "/\t/evil.example"],
    ["CR/LF", "/a\r\nSet-Cookie: x=1"],
    ["не строка", 42],
    ["пусто", ""],
    ["без слеша", "learning"],
    ["javascript:", "javascript:alert(1)"],
  ])("отклоняет: %s", (_name, value) => {
    expect(safeNextPath(value)).toBe("/");
  });
});

describe("тексты ошибок входа", () => {
  it("берёт русский текст по коду, иначе общий", () => {
    expect(authErrorMessage({ code: "invalid_credentials" })).toBe("Неверный email или пароль.");
    expect(authErrorMessage({ code: "weird" })).toBe(AUTH_FALLBACK_ERROR);
    expect(authErrorMessage({})).toBe(AUTH_FALLBACK_ERROR);
  });
});

describe("адрес сайта для писем", () => {
  const headers = { get: (name: string) => ({ origin: "https://evil.example", host: "app.example" }[name] ?? null) };
  it("берёт NEXT_PUBLIC_SITE_URL без завершающего слеша", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.example/");
    expect(siteOrigin(headers)).toBe("https://site.example");
  });
  it("в production без настройки не доверяет Origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(siteOrigin(headers)).toBe("https://app.example");
  });
});

describe("реестр уроков и разделов", () => {
  it("знает учебники, уроки 1–16 и семь разделов", () => {
    expect(isKnownTextbook("inha-2")).toBe(true);
    expect(isKnownTextbook("constructor")).toBe(false);
    expect(isKnownLesson("inha-1", 16)).toBe(true);
    expect(isKnownLesson("inha-1", 17)).toBe(false);
    expect(isKnownLesson("inha-1", NaN)).toBe(false);
    expect(LESSON_SECTION_KEYS).toHaveLength(7);
    expect(isKnownSection("쓰기")).toBe(true);
    expect(isKnownSection("выдуманный")).toBe(false);
  });
  it("битый ключ раздела не бросает исключение", () => {
    expect(decodeSectionKey("%E0%A4%A")).toBeNull();
    expect(decodeSectionKey("%EC%93%B0%EA%B8%B0")).toBe("쓰기");
  });
});
