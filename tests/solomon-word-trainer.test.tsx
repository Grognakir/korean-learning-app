import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SolomonOs } from "@/features/solomonOs/SolomonOs";
import { DocumentViewer } from "@/features/solomonOs/documents/DocumentViewer";
import { Messenger, SCRIPT } from "@/features/solomonOs/apps/Messenger";
import { createOsStore } from "@/features/solomonOs/store";
import { OsStorageProvider } from "@/features/solomonOs/OsStorage";
import { TRAINER_KEY, STUB_KEY, TRAINER_TTL, answerWord, advanceQuestion, chooseMode, chooseTopic, readyThread, startThread, type TrainerThread } from "@/features/solomonOs/wordTrainer/thread";
import { TOPICS, wordById } from "@/features/solomonOs/wordTrainer/topics";

const store = () => createOsStore();
const thread = () => store().load<TrainerThread>(TRAINER_KEY, null!);
const button = (name: RegExp | string) => screen.getByRole("button", { name });
const click = (name: RegExp | string) => fireEvent.click(button(name));
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const mount = () => render(<Messenger phone onRead={() => {}}/>);
function readyChat() { store().save("chat", { node: "end", log: SCRIPT.end.jia.map(([ko, ru]) => ["in", ko, ru]), pending: [], shown: true }); }
function start() { click(/^단어를 복습하고 싶어요/); click(/^옷과 색깔/); }
function quiz(mode: "choice" | "typing") { start(); click(/^준비됐어요!/); click(mode === "choice" ? /^보기 중에서 고르기/ : /^직접 쓰기/); }
const currentWord = () => wordById(TOPICS[0], thread().queue[thread().position]);

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-03T05:00:00Z")); vi.spyOn(Math, "random").mockReturnValue(.3); readyChat(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("Повтор слов в переписке", () => {
  it("появляется после печати в обычном сценарии и в конце, не изменяя ключ chat", () => {
    localStorage.removeItem("solomon:chat");
    mount();
    expect(screen.queryByRole("button", { name: /^단어를 복습하고 싶어요/ })).toBeNull();
    tick(900); tick(900);
    expect(button(/^단어를 복습하고 싶어요/)).toBeTruthy();
    const before = store().load("chat", null);
    quiz("choice"); fireEvent.click(within(screen.getByRole("group", { name: "Ваш ответ" })).getByRole("button", { name: /^그만하기/ }));
    expect(store().load("chat", null)).toEqual(before);
    expect(button(/^단어를 복습하고 싶어요/)).toBeTruthy();
    expect(button(/^한국어를 공부해요/)).toBeTruthy();
  });
  it("открывает документ отдельным окном Viewer, сохраняет чат и позволяет перечитать", () => {
    render(<SolomonOs/>);
    fireEvent.keyDown(button(/^메시지 — Сообщения/), { key: "Enter" });
    start(); click("Открыть документ: Одежда и цвета");
    let viewer = screen.getByRole("dialog", { name: "문서 뷰어" });
    const messenger = screen.getByRole("dialog", { name: "메시지 — 지아" });
    expect(messenger.contains(viewer)).toBe(false);
    for (const title of ["색깔 · Цвета", "옷 · Одежда", "동사 · Глаголы ношения", "무늬 · Узоры", "예문 · Примеры"]) expect(within(viewer).getByRole("heading", { name: title })).toBeTruthy();
    expect(within(viewer).getByText("Я ношу белую рубашку.")).toBeTruthy();
    expect(within(viewer).getByText("둘러요")).toBeTruthy();
    expect(within(viewer).queryByRole("textbox")).toBeNull();
    expect(within(viewer).queryByRole("button", { name: /^준비됐어요!/ })).toBeNull();
    fireEvent.click(within(viewer).getByRole("button", { name: "Закрыть окно" }));
    expect(screen.queryByRole("dialog", { name: "문서 뷰어" })).toBeNull();
    expect(screen.getByRole("dialog", { name: "메시지 — 지아" })).toBeTruthy();
    click(/^아직이에요/); expect(thread().phase).toBe("docSent");
    fireEvent.keyDown(button(/^문서 뷰어 — Просмотр документов/), { key: "Enter" });
    viewer = screen.getByRole("dialog", { name: "문서 뷰어" });
    expect(within(viewer).getByRole("heading", { name: "옷 · Одежда" })).toBeTruthy();
    expect(store().load<{id:string}>("documentViewer", null!).id).toBe("word-trainer:clothes");
    fireEvent.click(within(messenger).getByRole("button", { name: /^준비됐어요!/ }));
    expect(within(messenger).getByRole("button", { name: /^직접 쓰기/ })).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "문서 뷰어" })).toBeTruthy();
  });
  it("Viewer принимает документ другого приложения без зависимости от тренажёра", () => {
    render(<DocumentViewer document={{id:"notes:test",titleKo:"메모",titleRu:"Заметка",source:"메모",sections:[{id:"memo",titleKo:"메모",titleRu:"Заметка",groups:[{id:"rows",rows:[{id:"one",ko:"메모",ru:"Текст заметки"}]}]}]}}/>);
    expect(screen.getByText("Текст заметки")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
  it("выбор: показывает русский вопрос, принимает правильный и неправильный ответы, завершает по кнопке", () => {
    mount(); quiz("choice");
    expect(screen.getByText(/Что значит/)).toBeTruthy();
    const word = currentWord();
    click(word.ru);
    expect(thread().correct).toBe(1);
    expect(thread().log.at(-2)?.text).toBe(word.ru);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /^그만하기/ })).toHaveLength(2);
    tick(800);
    const wrong = thread().choices.find((value) => value !== currentWord().ru)!;
    const expected = `«${currentWord().ko}» — ${currentWord().ru}.`;
    click(wrong);
    expect(screen.getByText(expected)).toBeTruthy();
    expect(thread().correct).toBe(1);
    fireEvent.click(screen.getAllByRole("button", { name: /^그만하기/ })[0]);
    expect(thread().phase).toBe("finished");
    expect(thread().log.at(-1)?.ru).toBe("Молодец! Верно 1 из 2.");
    tick(1000); expect(thread().phase).toBe("finished");
    expect(button("처음부터")).toBeTruthy();
  });
  it("ввод: Enter и кнопка, опечатка засчитывается, черновик и пауза переживают перемонтирование", () => {
    mount(); quiz("typing");
    const field = screen.getByRole("textbox", { name: "Введите перевод" });
    fireEvent.submit(field.closest("form")!); expect(thread().answered).toBe(0);
    const answer = currentWord().ru;
    fireEvent.change(field, { target: { value: answer } });
    cleanup(); mount();
    expect((screen.getByRole("textbox", { name: "Введите перевод" }) as HTMLInputElement).value).toBe(answer);
    fireEvent.submit(screen.getByRole("textbox", { name: "Введите перевод" }).closest("form")!);
    expect(thread().correct).toBe(1);
    cleanup(); mount();
    expect(screen.getByRole("status")).toBeTruthy();
    tick(800);
    const value = currentWord().ru;
    fireEvent.change(screen.getByRole("textbox", { name: "Введите перевод" }), { target: { value: value.slice(0, -1) + "ы" } });
    click("Отправить");
    expect(thread().correct).toBe(2);
    expect(thread().log.at(-1)?.ko).toMatch(/^거의 맞아요/);
    fireEvent.click(screen.getAllByRole("button", { name: /^그만하기/ })[0]);
    expect(button(/^단어를 복습하고 싶어요/)).toBeTruthy();
  });
  it("после всех верных ответов предлагает завершить или повторить с новой очередью", () => {
    let saved = chooseMode(readyThread(chooseTopic(startThread(), "clothes")), "choice");
    const initialQueue = [...saved.queue];
    for (let i = 0; i < 60; i++) saved = advanceQuestion(answerWord(saved, wordById(TOPICS[0], saved.queue[saved.position]).ru));
    store().save(TRAINER_KEY, saved);
    mount(); click(currentWord().ru); tick(800);
    expect(thread().phase).toBe("completed");
    expect(button(/^끝내기/)).toBeTruthy();
    expect(button(/^다시 하기/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^단어를 복습하고 싶어요/ })).toBeNull();
    vi.mocked(Math.random).mockReturnValue(.8);
    click(/^다시 하기/);
    expect(thread().phase).toBe("quiz");
    expect(thread().mode).toBe("choice");
    expect(thread().answered).toBe(0);
    expect(thread().learned).toEqual([]);
    expect(new Set(thread().queue)).toEqual(new Set(initialQueue));
    expect(thread().queue).not.toEqual(initialQueue);
    let repeated = thread();
    while (repeated.phase === "quiz") repeated = advanceQuestion(answerWord(repeated, wordById(TOPICS[0], repeated.queue[repeated.position]).ru));
    cleanup(); store().save(TRAINER_KEY, repeated); mount();
    click(/^끝내기/);
    expect(thread().phase).toBe("finished");
    expect(button("처음부터")).toBeTruthy();
  });
  it("через 59 минут переписка есть, через 60 — только плашка; новое начало убирает её", () => {
    mount(); start();
    tick(59 * 60_000);
    expect(button("Открыть документ: Одежда и цвета")).toBeTruthy();
    tick(60_000);
    expect(store().load(TRAINER_KEY, null)).toBeNull();
    expect(store().load(STUB_KEY, null)).toMatchObject({ topicId: "clothes" });
    expect(screen.queryByRole("button", { name: "Открыть документ: Одежда и цвета" })).toBeNull();
    expect(screen.getByText("Отработка темы «Одежда и цвета»")).toBeTruthy();
    click(/^단어를 복습하고 싶어요/);
    expect(screen.queryByText("Отработка темы «Одежда и цвета»")).toBeNull();
    expect(store().load(STUB_KEY, null)).toBeNull();
  });
  it.each(["closed", "visibility"])("удаляет истёкшую беседу при возвращении: %s", (kind) => {
    mount(); start();
    if (kind === "closed") cleanup();
    vi.setSystemTime(Date.now() + TRAINER_TTL);
    if (kind === "closed") mount();
    else { vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible"); fireEvent(document, new Event("visibilitychange")); }
    expect(store().load(TRAINER_KEY, null)).toBeNull();
    expect(screen.getByText("Отработка темы «Одежда и цвета»")).toBeTruthy();
  });
  it("потом возвращает обычные ответы, аккаунты не видят чужую тренировку", () => {
    cleanup();
    const first = render(<OsStorageProvider userId="student-a"><Messenger phone onRead={() => {}}/></OsStorageProvider>);
    tick(900); tick(900); start(); first.unmount();
    render(<OsStorageProvider userId="student-b"><Messenger phone onRead={() => {}}/></OsStorageProvider>);
    expect(screen.queryByRole("button", { name: "Открыть документ: Одежда и цвета" })).toBeNull();
    tick(900); tick(900); click(/^단어를 복습하고 싶어요/); click(/^다음에 할게요/);
    expect(button(/^한국어를 공부해요/)).toBeTruthy();
    expect(createOsStore("student-a").load<TrainerThread>(TRAINER_KEY, null!).phase).toBe("docSent");
  });
});
