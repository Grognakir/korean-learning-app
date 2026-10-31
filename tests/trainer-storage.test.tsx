import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { StorageUserProvider, useTrainerStorageKey } from "@/lib/StorageUser";
import { readProgress, writeProgress } from "@/features/lessonSticker/progress";

beforeEach(()=>localStorage.clear());
function Key() { return <output>{useTrainerStorageKey("interview")}</output>; }

it("страница урока использует тот же ключ аккаунта, что и OS",()=>{
  render(<StorageUserProvider userId="account-a"><Key/></StorageUserProvider>);
  const key=screen.getByRole("status").textContent!;
  writeProgress("user:account-a:interview",["wedding"]);
  expect(readProgress(key)).toEqual(["wedding"]);
  expect(readProgress("user:account-b:interview")).toEqual([]);
});

it("переносит прежний прогресс только одному владельцу браузера",()=>{
  localStorage.setItem("lesson-sticker:interview:v1",JSON.stringify(["interview"]));
  expect(readProgress("user:account-a:interview")).toEqual(["interview"]);
  expect(readProgress("user:account-b:interview")).toEqual([]);
  writeProgress("user:account-b:interview",["rain"]);
  expect(readProgress("user:account-a:interview")).toEqual(["interview"]);
});
