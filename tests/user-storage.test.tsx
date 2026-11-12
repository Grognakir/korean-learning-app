import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { StorageUserProvider } from "@/lib/StorageUser";
import { useDraft } from "@/lib/useDraft";
import { loadProgress, recordRating, VOCAB_PROGRESS_KEY } from "@/features/learning/vocabProgress";

const A = "user:aaa:" + VOCAB_PROGRESS_KEY;
const B = "user:bbb:" + VOCAB_PROGRESS_KEY;

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.restoreAllMocks());

function Draft({ name }: { name: string }) {
  const [value, setValue] = useDraft(name);
  return <button onClick={() => setValue("текст")}>{`${name}=${value}`}</button>;
}

it("оценки слов двух аккаунтов в одном браузере не пересекаются", () => {
  recordRating("학교", "good", 1, A);
  expect(loadProgress(A)["학교"].rating).toBe("good");
  expect(loadProgress(B)["학교"]).toBeUndefined();
  expect(window.localStorage.getItem(B)).toBeNull();
});

it("старые оценки достаются только первому вошедшему аккаунту", () => {
  window.localStorage.setItem(VOCAB_PROGRESS_KEY, JSON.stringify({ 학교: { rating: "easy", at: 5, reviews: 2 } }));
  expect(loadProgress(A)["학교"].rating).toBe("easy");
  expect(window.localStorage.getItem("vocab-progress:legacy-owner")).toBe("aaa");
  expect(loadProgress(B)["학교"]).toBeUndefined();
});

it("если владельца старых данных записать не удалось, они не показываются", () => {
  window.localStorage.setItem(VOCAB_PROGRESS_KEY, JSON.stringify({ 학교: { rating: "easy", at: 5, reviews: 2 } }));
  const setItem = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key: string, value: string) {
    if (key === "vocab-progress:legacy-owner") throw new DOMException("quota", "QuotaExceededError");
    return setItem.call(this, key, value);
  });
  expect(loadProgress(A)["학교"]).toBeUndefined();
  expect(loadProgress(B)["학교"]).toBeUndefined();
});

it("при переполнении хранилища оценка видна сразу, а следующая строится от неё", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("quota", "QuotaExceededError"); });
  recordRating("학교", "good", 1, A);
  expect(loadProgress(A)["학교"].reviews).toBe(1);
  recordRating("학교", "easy", 2, A);
  expect(loadProgress(A)["학교"]).toEqual({ rating: "easy", at: 2, reviews: 2 });
});

it("черновик пишется под ключом аккаунта, без двойного префикса", () => {
  render(<StorageUserProvider userId="aaa"><Draft name="essay" /></StorageUserProvider>);
  act(() => screen.getByRole("button").click());
  expect(window.localStorage.getItem("user:aaa:essay")).toBe("текст");
  expect(window.localStorage.getItem("user:aaa:user:aaa:essay")).toBeNull();
  expect(window.localStorage.getItem("essay")).toBeNull();
});

it("черновик другого аккаунта не виден, старый ключ достаётся первому", () => {
  window.localStorage.setItem("essay", "старое");
  const first = render(<StorageUserProvider userId="aaa"><Draft name="essay" /></StorageUserProvider>);
  expect(screen.getByRole("button").textContent).toBe("essay=старое");
  first.unmount();
  render(<StorageUserProvider userId="bbb"><Draft name="essay" /></StorageUserProvider>);
  expect(screen.getByRole("button").textContent).toBe("essay=");
});
