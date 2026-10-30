import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SolomonOs } from "@/features/solomonOs/SolomonOs";
import { DAY_MS } from "@/features/solomonOs/schedule";

const stored = (key: string) => JSON.parse(localStorage.getItem(`solomon:${key}`) ?? "null");

const openIcon = (name: RegExp) => fireEvent.keyDown(screen.getByRole("button", { name }), { key: "Enter" });

/** Листать реплики («▶ 다음» / первый ответ), пока не выполнится условие. */
function playUntil(done: () => boolean) {
  for (let guard = 0; guard < 80 && !done(); guard++) {
    const next = screen.queryByRole("button", { name: "▶ 다음" });
    if (next) fireEvent.click(next);
    else {
      const replies = screen.queryByRole("group", { name: "Ваш ответ" });
      if (!replies) break;
      fireEvent.click(within(replies).getAllByRole("button")[0]);
    }
  }
  expect(done()).toBe(true);
}

function say(phrase: string) {
  fireEvent.click(screen.getByRole("button", { name: "Написать фразу самому" }));
  fireEvent.change(screen.getByLabelText("Что купить"), { target: { value: phrase } });
  fireEvent.click(screen.getByRole("button", { name: "Enter" }));
}

describe("Solomon OS: звонок 지아 → магазин → встреча", () => {
  beforeEach(() => {
    localStorage.clear();
    // Предыдущая ситуация — «свадьба», случайный выбор → первая из оставшихся (면접).
    localStorage.setItem("solomon:lastEpisode", JSON.stringify("wedding"));
    vi.spyOn(Math, "random").mockReturnValue(0);
  });
  afterEach(() => vi.restoreAllMocks());

  it("пропущенный → перезвонить → магазин → не одобрила → перекупить → одобрила → повторение через день", () => {
    render(<SolomonOs />);

    // При первом входе — пропущенный от 지아, счётчик на иконке 전화.
    expect(stored("calls")).toEqual([expect.objectContaining({ kind: "missed", caller: "지아" })]);
    openIcon(/^전화 — Телефон, 1$/);
    const missed = screen.getByRole("button", { name: /지아: 부재중/ });
    expect(screen.getByRole("button", { name: /^전화 — Телефон$/ })).toBeTruthy();

    // Перезвонить: разговор в окне телефона до «CALL ENDED» → задание.
    fireEvent.click(missed);
    expect(stored("calls").map((c: { kind: string }) => c.kind)).toEqual(["missed", "outgoing"]);
    playUntil(() => Boolean(screen.queryByText("최근 기록")));
    expect(stored("task")).toMatchObject({ trainerId: "lesson10-clothes", episodeId: "interview", cart: [] });

    // Магазин: только костюм → встреча → не одобрила → перекупить.
    openIcon(/^쇼핑 — Магазин, 1$/);
    say("남색 정장 주세요");
    fireEvent.click(screen.getByRole("button", { name: "계산할게요" }));
    const meeting = () => screen.queryByRole("dialog", { name: "Встреча с 지아" });
    expect(meeting()).toBeTruthy();
    playUntil(() => Boolean(screen.queryByRole("button", { name: /Перекупить/ })));
    expect(screen.getByText("ЧТО ИСПРАВИТЬ")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Перекупить/ }));
    expect(meeting()).toBeNull();
    expect(stored("task").cart).toEqual([{ id: "suit", color: "navy", pattern: "plain" }]);

    // Докупить → одобрила → Mission completed → обратно в ОС.
    say("흰색 와이셔츠 주세요");
    say("남색 넥타이 주세요");
    say("검은색 구두 주세요");
    expect(stored("task").cart).toHaveLength(4);
    const before = Date.now();
    fireEvent.click(screen.getByRole("button", { name: "계산할게요" }));
    playUntil(() => Boolean(screen.queryByRole("button", { name: /Mission completed/ })));
    expect(screen.getByText("MISSION COMPLETE")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Mission completed/ }));
    expect(meeting()).toBeNull();
    expect(stored("task")).toBeNull();
    expect(screen.queryByRole("dialog", { name: "쇼핑" })).toBeNull();

    const sched = stored("schedule")["lesson10-clothes"];
    expect(sched.stage).toBe(1);
    expect(sched.dueAt - before).toBeGreaterThanOrEqual(DAY_MS - 1000);
    expect(sched.dueAt - before).toBeLessThanOrEqual(DAY_MS + 60_000);
    expect(JSON.parse(localStorage.getItem("lesson-sticker:interview:v1") ?? "[]")).toContain("interview");
  });

  it("время повторения пришло при открытой ОС — входящий звонок; ответ запускает разговор", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    const now = Date.now();
    localStorage.setItem(
      "solomon:schedule",
      JSON.stringify({ "lesson10-clothes": { stage: 1, dueAt: now + 5000 } }),
    );
    render(<SolomonOs />);
    expect(screen.queryByRole("dialog", { name: /Входящий звонок/ })).toBeNull();
    act(() => vi.advanceTimersByTime(6000));
    const incoming = screen.getByRole("dialog", { name: "Входящий звонок: 지아" });
    fireEvent.click(within(incoming).getByRole("button", { name: "[ START ]" }));
    expect(screen.queryByRole("dialog", { name: /Входящий звонок/ })).toBeNull();
    expect(stored("calls").map((c: { kind: string }) => c.kind)).toEqual(["incoming"]);
    expect(screen.getByRole("dialog", { name: "전화 — 지아" })).toBeTruthy();
    vi.useRealTimers();
  });

  it("не взял трубку за минуту — пропущенный и счётчик на 전화", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    const now = Date.now();
    localStorage.setItem(
      "solomon:schedule",
      JSON.stringify({ "lesson10-clothes": { stage: 2, dueAt: now + 1000 } }),
    );
    render(<SolomonOs />);
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("dialog", { name: "Входящий звонок: 지아" })).toBeTruthy();
    act(() => vi.advanceTimersByTime(61_000));
    expect(screen.queryByRole("dialog", { name: /Входящий звонок/ })).toBeNull();
    expect(stored("calls").map((c: { kind: string }) => c.kind)).toEqual(["missed"]);
    expect(screen.getByRole("button", { name: /^전화 — Телефон, 1$/ })).toBeTruthy();
    vi.useRealTimers();
  });

  it("уведомление: баннер с крестиком, колокольчик со счётчиком и списком", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    render(<SolomonOs />);
    act(() => vi.advanceTimersByTime(700));
    // Пропущенный при входе — баннер и счётчик на колокольчике.
    const banner = screen.getByRole("status", { name: /지아: 부재중 전화 1통/ });
    expect(screen.getByRole("button", { name: /Уведомления: 1 новых/ })).toBeTruthy();
    fireEvent.click(within(banner).getByRole("button", { name: "Закрыть уведомление" }));
    act(() => vi.advanceTimersByTime(300));
    expect(screen.queryByRole("status")).toBeNull();
    // Запись осталась в списке; открытие списка отмечает прочитанным.
    fireEvent.click(screen.getByRole("button", { name: /Уведомления/ }));
    const panel = screen.getByRole("dialog", { name: "Уведомления" });
    expect(within(panel).getByText("부재중 전화 1통")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Уведомления" })).toBeTruthy();
    fireEvent.click(within(panel).getByRole("button", { name: /부재중 전화 1통/ }));
    expect(screen.getByRole("dialog", { name: "전화" })).toBeTruthy();
    vi.useRealTimers();
  });
});
