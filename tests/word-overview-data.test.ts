import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { getWordOverview } from "@/features/dashboard/wordOverview";

const words = [
  { id: "ko-global", language: "ko", owner: null },
  { id: "en-global", language: "en", owner: null },
  { id: "en-own", language: "en", owner: "user" },
  { id: "en-other", language: "en", owner: "other" },
];
const reviews = [
  { word: "ko-global", user: "user", due: "2000-01-01T00:00:00Z" },
  { word: "en-global", user: "user", due: "2000-01-01T00:00:00Z" },
  { word: "en-own", user: "user", due: "2999-01-01T00:00:00Z" },
  { word: "en-global", user: "other", due: "2000-01-01T00:00:00Z" },
];

function client(fetch: typeof globalThis.fetch) {
  return createClient("https://example.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch },
  });
}

const fixtureFetch: typeof fetch = async (input) => {
  const url = new URL(String(input));
  const params = url.searchParams;
  let count: number;
  if (url.pathname.endsWith("/words")) {
    count = words.filter((word) =>
      (!params.has("language") || params.get("language") === `eq.${word.language}`) &&
      (!params.has("or") || word.owner === null || params.get("or")!.includes(`owner_user_id.eq.${word.owner}`)),
    ).length;
  } else {
    count = reviews.filter((review) => {
      const word = words.find((item) => item.id === review.word)!;
      const due = params.get("due_at")?.slice(4);
      return (!params.has("user_id") || params.get("user_id") === `eq.${review.user}`) &&
        (!params.has("words.language") || params.get("words.language") === `eq.${word.language}`) &&
        (!due || new Date(review.due) <= new Date(due));
    }).length;
  }
  return new Response(null, { headers: { "content-range": `*/${count}` } });
};

describe("показатели главной", () => {
  it("разделяет языки, пользователей и наступившие повторения", async () => {
    const supabase = client(fixtureFetch);
    expect(await getWordOverview(supabase, "user", "en")).toEqual({ total: 2, reviewed: 2, due: 1 });
    expect(await getWordOverview(supabase, "user", "ko")).toEqual({ total: 1, reviewed: 1, due: 1 });
  });

  it("использует полный счётчик для словаря больше тысячи слов", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(null, { headers: { "content-range": "*/2500" } }));
    expect(await getWordOverview(client(fetch), "user", "ko")).toEqual({ total: 2500, reviewed: 2500, due: 2500 });
  });

  it("не превращает отказ базы в нулевые показатели", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(JSON.stringify({ message: "unavailable" }), { status: 503 }));
    expect(await getWordOverview(client(fetch), "user", "ko")).toBeNull();
  });

  it("не выдаёт неполный ответ за пустой словарь", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(null));
    expect(await getWordOverview(client(fetch), "user", "ko")).toBeNull();
  });
});
