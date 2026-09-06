// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth: { getUser } }) }));
beforeEach(() => getUser.mockResolvedValue({ data: { user: null } }));

it.each([
  "/learning", "/learning/trainers", "/learning/trainers/flashcards",
  "/learning/trainers/flashcards/antonyms-synonyms", "/learning/trainers/topics", "/learning/trainers/topics/habits",
])("открывает гостю %s", async (path) => {
  const response = await updateSession(new NextRequest(`http://localhost${path}`));
  expect(response.headers.get("location")).toBeNull();
});

it.each(["/learning/plans", "/learning/plans/1", "/learning/plans/1/grammar", "/settings"])("сохраняет защиту %s", async (path) => {
  const response = await updateSession(new NextRequest(`http://localhost${path}`));
  expect(response.headers.get("location")).toBe("http://localhost/login");
});

it("пропускает авторизованного пользователя к планам", async () => {
  getUser.mockResolvedValue({ data: { user: { id: "user" } } });
  const response = await updateSession(new NextRequest("http://localhost/learning/plans"));
  expect(response.headers.get("location")).toBeNull();
});
