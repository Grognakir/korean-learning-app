import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dictionary } from "@/features/solomonOs/dictionary/Dictionary";
import { OsStorageProvider } from "@/features/solomonOs/OsStorage";
import { createOsStore } from "@/features/solomonOs/store";
import { emptyDictionary, putEntry, readDictionary, writeDictionary } from "@/features/solomonOs/dictionary/entries";
import { SolomonOs } from "@/features/solomonOs/SolomonOs";
import { SCRIPT, Messenger } from "@/features/solomonOs/apps/Messenger";
import { TRAINER_KEY, TRAINER_TTL, readTrainer, threadTopic, type TrainerThread } from "@/features/solomonOs/wordTrainer/thread";

const store = () => createOsStore();
const thread = () => store().load<TrainerThread>(TRAINER_KEY, null!);
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const fill = (name: string, value: string) => fireEvent.change(screen.getByRole("textbox", { name }), { target: { value } });
function seed() {
  let data = emptyDictionary();
  data = putEntry(data, { ko: "사과", ru: "яблоко, плод яблони" }, 1, "a").data;
  data = putEntry(data, { ko: "학교/학교에", ru: "школа" }, 2, "b").data;
  writeDictionary(store(), data);
}
function chat() { store().save("chat", { node: "end", log: SCRIPT.end.jia.map(([ko, ru]) => ["in", ko, ru]), pending: [], shown: true }); }
function personalQuiz(mode: "choice" | "typing") { click(/^단어를 복습하고 싶어요/); click(/^내 단어장/); click(/^준비됐어요!/); click(mode === "choice" ? /^보기 중에서 고르기/ : /^직접 쓰기/); }

beforeEach(() => { localStorage.clear(); vi.spyOn(Math, "random").mockReturnValue(.8); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("Приложение Словарь", () => {
  it("пустой список, быстрый ввод, дубль, слово без перевода и повторное открытие", () => {
    render(<Dictionary/>);
    expect(screen.getByText("Пока нет слов. Добавьте первое.")).toBeTruthy();
    expect(readDictionary(store()).words).toHaveLength(0);
    expect(screen.queryByRole("textbox", { name: "한국어 · Корейский" })).toBeNull();
    click("Новая запись");
    fill("한국어 · Корейский", "사과"); fill("번역 · Перевод", "яблоко"); click("추가 · Добавить");
    expect((screen.getByRole("textbox", { name: "한국어 · Корейский" }) as HTMLInputElement).value).toBe("");
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "한국어 · Корейский" }));
    fill("한국어 · Корейский", "학교"); fireEvent.submit(screen.getByRole("textbox", { name: "한국어 · Корейский" }).closest("form")!);
    expect(screen.getByText("без перевода")).toBeTruthy();
    expect(screen.getByText("всего 2 · в тренировке 1")).toBeTruthy();
    fill("한국어 · Корейский", "사 과"); click("추가 · Добавить");
    expect(screen.getByRole("alert").textContent).toContain("Такое слово уже есть.");
    click("수정 · Открыть слово");
    expect((screen.getByRole("textbox", { name: "한국어 · Корейский" }) as HTMLInputElement).value).toBe("사과");
    cleanup(); render(<Dictionary/>);
    expect(screen.getByText("всего 2 · в тренировке 1")).toBeTruthy();
  });
  it("поиск, правка, отмена и удаление только после подтверждения", () => {
    seed(); render(<Dictionary/>);
    fill("검색 / Поиск", "школа");
    expect(screen.queryByRole("button", { name: /^사과/ })).toBeNull();
    click(/^학교\/학교에/); fill("번역 · Перевод", "учебное заведение"); click("저장 · Сохранить");
    expect(readDictionary(store()).words[1].ru).toBe("учебное заведение");
    expect(screen.queryByRole("dialog", { name: "Редактирование слова" })).toBeNull();
    click("Новая запись");
    expect((screen.getByRole("textbox", { name: "한국어 · Корейский" }) as HTMLInputElement).value).toBe("");
    click("취소 · Отмена");
    fill("검색 / Поиск", ""); click("Удалить: 사과");
    const confirm = screen.getByRole("dialog", { name: "Подтверждение удаления" });
    fireEvent.click(within(confirm).getByRole("button", { name: "취소 · Отмена" }));
    expect(readDictionary(store()).words).toHaveLength(2);
    click("Удалить: 사과"); fireEvent.click(within(screen.getByRole("dialog", { name: "Подтверждение удаления" })).getByRole("button", { name: "삭제 · Удалить" }));
    expect(readDictionary(store()).words.map((w) => w.id)).toEqual(["b"]);
  });
  it.each(["한 → 러 · 고르기", "러 → 한 · 고르기", "러 → 한 · 쓰기"])("режим %s: весь круг, статистика, повтор, выход", (mode) => {
    seed(); render(<Dictionary/>);
    click("Тренировка карточек");
    fireEvent.click(within(screen.getByRole("group", { name: "Режим карточек" })).getByRole("button", { name: new RegExp(`^${mode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }));
    click("시작 · Начать");
    for (const answer of mode.startsWith("한") ? ["яблоко", "школа"] : ["사과", "학교"]) {
      if (mode.endsWith("쓰기")) { fill("한국어 · Ответ по-корейски", answer); fireEvent.submit(screen.getByRole("textbox", { name: "한국어 · Ответ по-корейски" }).closest("form")!); }
      else fireEvent.click(within(screen.getByRole("group", { name: "Ваш ответ" })).getByRole("button", { name: answer }));
      expect(screen.getByRole("status").textContent).toContain("Верно");
      expect(screen.getByRole("button", { name: "다음 · Дальше" })).toBe(document.activeElement);
      click("다음 · Дальше");
    }
    expect(screen.getByRole("heading", { name: /끝! 2\/2/ })).toBeTruthy();
    expect(readDictionary(store()).words.map((w) => w.ok)).toEqual([1, 1]);
    expect((screen.getByRole("button", { name: "틀린 단어 다시 · Повторить ошибки" }) as HTMLButtonElement).disabled).toBe(true);
    click("한 바퀴 더 · Ещё круг"); click("그만하기 · Закончить"); click("나가기 · Выйти");
    expect(screen.getByRole("group", { name: "Режим карточек" })).toBeTruthy();
  });
  it("показывает ошибочный ввод и повторяет ошибки, сессия теряется при закрытии", () => {
    seed(); render(<Dictionary/>);
    click("Тренировка карточек"); click(/^러 → 한 · 쓰기/); click("시작 · Начать");
    fill("한국어 · Ответ по-корейски", "사고"); click("입력 · Ответить ↵");
    expect(screen.getByRole("status").textContent).toContain("Ваш ответ: 사고");
    click("그만하기 · Закончить"); click("틀린 단어 다시 · Повторить ошибки");
    expect(screen.getByText("1 / 1 · 정답 0")).toBeTruthy();
    cleanup(); render(<Dictionary/>); click("Тренировка карточек");
    expect(screen.getByRole("group", { name: "Режим карточек" })).toBeTruthy();
    expect(readDictionary(store()).words[0].fail).toBe(1);
  });
  it("минимум слов и только сложные; пользовательские данные изолированы", () => {
    render(<OsStorageProvider userId="dict-user" migrateLegacy={false}><Dictionary/></OsStorageProvider>);
    click("Новая запись");
    fill("한국어 · Корейский", "사과"); fill("번역 · Перевод", "яблоко"); click("추가 · Добавить");
    click("Закрыть диалог");
    click("Тренировка карточек");
    expect((screen.getByRole("button", { name: "시작 · Начать" }) as HTMLButtonElement).disabled).toBe(true);
    click(/^러 → 한 · 쓰기/);
    expect((screen.getByRole("button", { name: "시작 · Начать" }) as HTMLButtonElement).disabled).toBe(false);
    click("어려운 단어 · Только сложные"); expect((screen.getByRole("button", { name: "시작 · Начать" }) as HTMLButtonElement).disabled).toBe(true);
    cleanup(); render(<OsStorageProvider userId="other-user" migrateLegacy={false}><Dictionary/></OsStorageProvider>);
    expect(screen.getByText("всего 0 · в тренировке 0")).toBeTruthy();
  });
  it("иконка открывает самостоятельное окно ОС", () => {
    render(<SolomonOs/>);
    fireEvent.keyDown(screen.getByRole("button", { name: /^단어장 — Словарь/ }), { key: "Enter" });
    expect(screen.getByRole("dialog", { name: "단어장" })).toBeTruthy();
  });
});

describe("Мой словарь в мессенджере", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-04T06:00:00Z")); chat(); });
  it("меньше двух слов: объяснение и повторный выбор темы", () => {
    render(<Messenger phone onRead={() => {}}/>);
    click(/^단어를 복습하고 싶어요/); click(/^내 단어장/);
    expect(thread().phase).toBe("askTopic");
    expect(thread().log.at(-1)?.ru).toContain("нужно минимум 2 слова с переводом");
    expect(screen.getByRole("button", { name: /^옷과 색깔/ })).toBeTruthy();
  });
  it("копия и документ переживают правку/удаление; статистика в обоих окнах и TTL", () => {
    seed();
    const onOpenDocument = vi.fn();
    render(<><Dictionary/><Messenger phone onRead={() => {}} onOpenDocument={onOpenDocument}/></>);
    click(/^단어를 복습하고 싶어요/); click(/^내 단어장/); click("Открыть документ: Мой словарь");
    expect(onOpenDocument.mock.calls[0][0]).toMatchObject({ titleKo: "내 단어장 · 단어장", sections: [{ groups: [{ rows: [{ ko: "사과", ru: "яблоко" }, { ko: "학교", ru: "школа" }] }] }] });
    const copy = structuredClone(thread().topicSnapshot);
    act(() => writeDictionary(store(), { v: 1, words: [{ ...readDictionary(store()).words[0], ko: "새", ru: "птица" }] }));
    click(/^준비됐어요!/); click(/^보기 중에서 고르기/);
    expect(thread().choices).toHaveLength(2);
    click("яблоко");
    expect(readDictionary(store()).words[0]).toMatchObject({ ko: "새", ru: "птица", ok: 1 });
    expect(screen.getByText("✓ 1 · × 0")).toBeTruthy();
    act(() => vi.advanceTimersByTime(800)); click("школа");
    expect(readDictionary(store()).words).toHaveLength(1);
    expect(thread().topicSnapshot).toEqual(copy);
    cleanup(); render(<Messenger phone onRead={() => {}} onOpenDocument={onOpenDocument}/>);
    expect(readTrainer(store()).thread?.topicSnapshot).toEqual(copy);
    act(() => vi.advanceTimersByTime(800));
    act(() => vi.advanceTimersByTime(TRAINER_TTL + 30_000));
    expect(screen.getByText("Отработка темы «Мой словарь»")).toBeTruthy();
  });
  it("ввод принимает варианты перевода и опечатки, считает каждую попытку один раз", () => {
    seed(); render(<Messenger phone onRead={() => {}}/>); personalQuiz("typing");
    expect(threadTopic(thread())?.words).toHaveLength(2);
    fill("Введите перевод", "плод яблони"); click("Отправить");
    expect(readDictionary(store()).words[0].ok).toBe(1);
    act(() => vi.advanceTimersByTime(800)); fill("Введите перевод", "не знаю"); click("Отправить");
    expect(readDictionary(store()).words[1].fail).toBe(1);
    cleanup(); render(<Messenger phone onRead={() => {}}/>);
    act(() => vi.advanceTimersByTime(3000)); fill("Введите перевод", "шкала"); click("Отправить");
    expect(readDictionary(store()).words[1]).toMatchObject({ fail: 1, ok: 1 });
    act(() => vi.advanceTimersByTime(800));
    expect(thread().phase).toBe("completed");
    expect(thread().log.at(-1)?.ru).toContain("Мой словарь");
  });
});
