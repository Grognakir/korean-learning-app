import { expect, it, vi } from "vitest";
import { getLearningContext } from "@/features/auth/getLearningContext";
const { from, getCookie } = vi.hoisted(() => ({ from: vi.fn(), getCookie: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) }, from }) }));
vi.mock("@/features/language/getActiveLanguage", () => ({ readGuestLanguage: async () => "en" }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: getCookie }) }));

it("использует язык и размер сессии гостя без чтения профиля", async () => {
  getCookie.mockReturnValue({ value: "12" });
  const context = await getLearningContext();
  expect(context).toMatchObject({ user: null, username: null, activeLanguage: "en", newCardsLimit: 12 });
  expect(from).not.toHaveBeenCalled();
});
it.each([["invalid", 20], ["1000", 50], ["-1", 5]])("ограничивает некорректный гостевой лимит %s", async (value, expected) => {
  getCookie.mockReturnValue({ value });
  expect((await getLearningContext()).newCardsLimit).toBe(expected);
});
