import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { SolomonOs } from "@/features/solomonOs/SolomonOs";
import { createOsStore } from "@/features/solomonOs/store";

beforeEach(() => localStorage.clear());

it("вход показывает рабочий стол, сохранённый звонок продолжается только по нажатию", () => {
  const store = createOsStore();
  const saved = { trainerId: "lesson10-clothes", episodeId: "interview", reminder: true };
  store.save("activeCall", saved);
  const first = render(<SolomonOs/>);
  expect(screen.queryByRole("dialog", { name: "전화 — 지아" })).toBeNull();
  expect(store.load("activeCall", null)).toMatchObject(saved);
  fireEvent.keyDown(screen.getByRole("button", { name: /^전화 — Телефон/ }), { key: "Enter" });
  const call = screen.getByRole("dialog", { name: "전화 — 지아" });
  expect(call).toBeTruthy();
  fireEvent.click(within(call).getByRole("button", { name: "Закрыть окно" }));
  expect(screen.queryByRole("dialog", { name: "전화 — 지아" })).toBeNull();
  expect(store.load("activeCall", null)).toMatchObject(saved);
  first.unmount(); render(<SolomonOs/>);
  expect(screen.queryByRole("dialog", { name: "전화 — 지아" })).toBeNull();
  fireEvent.keyDown(screen.getByRole("button", { name: /^전화 — Телефон/ }), { key: "Enter" });
  expect(screen.getByRole("dialog", { name: "전화 — 지아" })).toBeTruthy();
});
