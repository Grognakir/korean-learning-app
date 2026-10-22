import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { getWordOverview } from "@/features/dashboard/wordOverview";

const words = [
  { id: "global", owner: null },
  { id: "own", owner: "user" },
  { id: "other", owner: "other" },
];
const reviews = [
  { word: "global", user: "user", due: "2000-01-01T00:00:00Z" },
  { word: "own", user: "user", due: "2999-01-01T00:00:00Z" },
  { word: "global", user: "other", due: "2000-01-01T00:00:00Z" },
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
      !params.has("or") || word.owner === null || params.get("or")!.includes(`owner_user_id.eq.${word.owner}`),
    ).length;
  } else {
    count = reviews.filter((review) => {
      const due = params.get("due_at")?.slice(4);
      return (!params.has("user_id") || params.get("user_id") === `eq.${review.user}`) &&
        (!due || new Date(review.due) <= new Date(due));
    }).length;
  }
  return new Response(null, { headers: { "content-range": `*/${count}` } });
};

describe("показатели главной", () => {
  it("разделяет пользователей и наступившие повторения", async () => {
    const supabase = client(fixtureFetch);
    expect(await getWordOverview(supabase, "user")).toEqual({ total: 2, reviewed: 2, due: 1 });
  });

  it("использует полный счётчик для словаря больше тысячи слов", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(null, { headers: { "content-range": "*/2500" } }));
    expect(await getWordOverview(client(fetch), "user")).toEqual({ total: 2500, reviewed: 2500, due: 2500 });
  });

  it("не превращает отказ базы в нулевые показатели", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(JSON.stringify({ message: "unavailable" }), { status: 503 }));
    expect(await getWordOverview(client(fetch), "user")).toBeNull();
  });

  it("не выдаёт неполный ответ за пустой словарь", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(null));
    expect(await getWordOverview(client(fetch), "user")).toBeNull();
  });
});
