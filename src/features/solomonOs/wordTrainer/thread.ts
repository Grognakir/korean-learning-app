import type { OsStore } from "../store";
import { buildChoices, buildQueue, checkAnswer, deferMistakes } from "./quiz";
import { TOPICS, topicById, wordById, type WordTopic } from "./topics";

export const TRAINER_KEY = "wordTrainer";
export const STUB_KEY = "wordTrainerStub";
export const TRAINER_TTL = 60 * 60 * 1000;
export type TrainerMode = "choice" | "typing";
export type TrainerMessage = { who: "in" | "out"; at: number; ko?: string; ru?: string; text?: string; wordId?: string; attachment?: string; correction?: string };
export type TrainerThread = {
  v: 1; topicId: string; startedAt: number; updatedAt: number;
  phase: "askTopic" | "docSent" | "askMode" | "quiz" | "completed" | "finished"; mode?: TrainerMode;
  queue: string[]; position: number; answered: number; correct: number; learned: string[];
  mistakes: string[]; log: TrainerMessage[]; choices: string[]; awaitingQuestion: boolean; draft: string;
  topicSnapshot?: WordTopic;
};
export type TrainerStub = { topicId: string; at: number };
export type TrainerSnapshot = { thread: TrainerThread | null; stub: TrainerStub | null };
const msg = (who: TrainerMessage["who"], ko: string, ru: string, at: number): TrainerMessage => ({ who, ko, ru, at });
const add = (thread: TrainerThread, messages: TrainerMessage[], at: number): TrainerThread => ({ ...thread, log: [...thread.log, ...messages], updatedAt: at });
export const threadTopic = (thread: TrainerThread) => thread.topicId === "personal" ? thread.topicSnapshot : topicById(thread.topicId);

export function startThread(now = Date.now()): TrainerThread {
  return {
    v: 1, topicId: TOPICS[0].id, startedAt: now, updatedAt: now, phase: "askTopic", queue: [], position: 0,
    answered: 0, correct: 0, learned: [], mistakes: [], choices: [], awaitingQuestion: false, draft: "",
    log: [msg("out", "단어를 복습하고 싶어요.", "Хочу повторить слова.", now), msg("in", "어떤 단어요?", "Какие слова?", now)],
  };
}
export function chooseTopic(thread: TrainerThread, topicId: string, now = Date.now(), personalTopic?: WordTopic): TrainerThread {
  const topic = topicId === "personal" ? personalTopic : topicById(topicId);
  if (thread.phase === "askTopic" && topicId === "personal" && (!topic || topic.words.length < 2)) return add(thread, [
    msg("out", "내 단어장", "Мой словарь", now),
    msg("in", "단어장에 단어가 더 필요해요. 단어장 앱에서 추가해 줘요.", "В словаре мало слов. Добавь ещё в приложении «Словарь» (нужно минимум 2 слова с переводом).", now),
  ], now);
  if (thread.phase !== "askTopic" || !topic) return thread;
  return add({ ...thread, topicId, phase: "docSent", ...(topicId === "personal" ? { topicSnapshot: structuredClone(topic) } : {}) }, [
    msg("out", topic.titleKo, topic.titleRu, now), msg("in", "좋아요! 단어장을 보낼게요.", "Хорошо! Сейчас отправлю список слов.", now),
    { who: "in", attachment: topicId, at: now }, msg("in", "다 읽으면 말해 주세요.", "Прочитаешь — скажи.", now),
  ], now);
}
export function readLater(thread: TrainerThread, now = Date.now()): TrainerThread {
  if (thread.phase !== "docSent") return thread;
  return add(thread, [msg("out", "아직이에요.", "Ещё читаю.", now), msg("in", "천천히 읽어요. 준비되면 말해 줘요.", "Не торопись. Будешь готов — скажи.", now)], now);
}
export function readyThread(thread: TrainerThread, now = Date.now()): TrainerThread {
  if (thread.phase !== "docSent") return thread;
  return add({ ...thread, phase: "askMode" }, [msg("out", "준비됐어요!", "Я готов к проверке.", now), msg("in", "어떻게 연습할까요?", "Как будем тренироваться?", now)], now);
}
function question(thread: TrainerThread, now: number): TrainerThread {
  const topic = threadTopic(thread)!;
  const word = wordById(topic, thread.queue[thread.position]);
  return add({ ...thread, awaitingQuestion: false, choices: buildChoices(topic, word) }, [{ who: "in", wordId: word.id, at: now }], now);
}
export function chooseMode(thread: TrainerThread, mode: TrainerMode, now = Date.now()): TrainerThread {
  if (thread.phase !== "askMode") return thread;
  const started = add({ ...thread, mode, phase: "quiz", queue: buildQueue(threadTopic(thread)!) }, [
    msg("out", mode === "choice" ? "보기 중에서 고르기" : "직접 쓰기", mode === "choice" ? "Выбирать из вариантов" : "Писать самому", now),
    msg("in", "시작해요! 그만하고 싶으면 '그만하기'를 눌러요.", "Начинаем! Захочешь закончить — нажми «Закончить».", now),
  ], now);
  return question(started, now);
}
export function answerWord(thread: TrainerThread, input: string, now = Date.now()): TrainerThread {
  if (thread.phase !== "quiz" || thread.awaitingQuestion || !input.trim()) return thread;
  const word = wordById(threadTopic(thread)!, thread.queue[thread.position]);
  if (thread.mode === "choice" && !thread.choices.includes(input)) return thread;
  const result = thread.mode === "choice" ? input === word.ru ? "exact" : "wrong" : checkAnswer(word, input);
  const correct = result !== "wrong";
  const reactions = [["맞아요!", "Верно!"], ["정답이에요!", "Правильный ответ!"], ["잘했어요!", "Отлично!"]];
  const [ko, ru] = reactions[thread.answered % reactions.length];
  const reaction: TrainerMessage = result === "typo"
    ? msg("in", `거의 맞아요. 정답은 '${word.ru}'예요.`, `Почти. Правильно — «${word.ru}».`, now)
    : correct ? msg("in", ko, ru, now) : { ...msg("in", "아쉬워요.", "Жаль.", now), correction: `«${word.ko}» — ${word.ru}.` };
  const learned = correct ? [...new Set([...thread.learned, word.id])] : thread.learned;
  const mistakes = correct ? thread.mistakes.filter((id) => id !== word.id) : [...new Set([...thread.mistakes, word.id])];
  const pending = deferMistakes(thread.queue.slice(thread.position + 1), mistakes, correct ? undefined : word.id);
  return add({ ...thread, answered: thread.answered + 1, correct: learned.length, learned, mistakes,
    queue: [...thread.queue.slice(0, thread.position + 1), ...pending], awaitingQuestion: true, draft: "" }, [{ who: "out", text: input, at: now }, reaction], now);
}
export function advanceQuestion(thread: TrainerThread, now = Date.now()): TrainerThread {
  if (thread.phase !== "quiz" || !thread.awaitingQuestion) return thread;
  if (thread.position + 1 < thread.queue.length) return question({ ...thread, position: thread.position + 1 }, now);
  return add({ ...thread, phase: "completed", awaitingQuestion: false }, [summary(thread, now)], now);
}
function summary(thread: TrainerThread, now: number) {
  return msg("in", `수고했어요! ${thread.topicId === "personal" ? "내 단어장: " : ""}${thread.correct}/${thread.answered}개 맞았어요.`, `${thread.topicId === "personal" ? "Мой словарь. " : ""}Молодец! Верно ${thread.correct} из ${thread.answered}.`, now);
}

export function restartThread(thread: TrainerThread, now = Date.now()): TrainerThread {
  if (thread.phase !== "completed" || !thread.mode) return thread;
  const reset: TrainerThread = { ...thread, phase: "quiz", queue: buildQueue(threadTopic(thread)!), position: 0,
    answered: 0, correct: 0, learned: [], mistakes: [], choices: [], awaitingQuestion: false, draft: "" };
  return question(add(reset, [msg("out", "다시 하기", "Повторить", now),
    msg("in", "시작해요! 그만하고 싶으면 '그만하기'를 눌러요.", "Начинаем! Захочешь закончить — нажми «Закончить».", now)], now), now);
}
export function finishThread(thread: TrainerThread, later = false, now = Date.now()): TrainerThread {
  if (thread.phase === "finished") return thread;
  if (thread.phase === "completed") return add({ ...thread, phase: "finished" }, [msg("out", "끝내기", "Завершить", now)], now);
  return add({ ...thread, phase: "finished", awaitingQuestion: false, draft: "" }, later ? [msg("out", "다음에 할게요.", "Потом.", now)] : [
    msg("out", "그만하기", "Закончить", now),
    summary(thread, now),
  ], now);
}
export const isActive = (thread: TrainerThread | null) => Boolean(thread && thread.phase !== "finished");
export function expireSnapshot(snapshot: TrainerSnapshot, now = Date.now()): TrainerSnapshot {
  if (!snapshot.thread || now - snapshot.thread.updatedAt < TRAINER_TTL) return snapshot;
  return { thread: null, stub: { topicId: snapshot.thread.topicId, at: now } };
}
export function saveSnapshot(store: OsStore, snapshot: TrainerSnapshot) {
  if (snapshot.thread) store.save(TRAINER_KEY, snapshot.thread); else store.remove(TRAINER_KEY);
  if (snapshot.stub) store.save(STUB_KEY, snapshot.stub); else store.remove(STUB_KEY);
}
export function readTrainer(store: OsStore, now = Date.now()): TrainerSnapshot {
  const saved = store.load<TrainerThread | null>(TRAINER_KEY, null);
  const topic = saved && threadTopic(saved);
  const validTopic = topic && Array.isArray(topic.words) && Array.isArray(topic.document) && (topic.id !== "personal" || topic.words.length >= 2
    && topic.words.every((word) => word && typeof word.id === "string" && typeof word.ko === "string" && typeof word.ru === "string" && Array.isArray(word.accept)));
  const valid = saved?.v === 1 && validTopic && Array.isArray(saved.log) && Array.isArray(saved.queue) && Array.isArray(saved.mistakes)
    && Number.isFinite(saved.updatedAt) && ["askTopic", "docSent", "askMode", "quiz", "completed", "finished"].includes(saved.phase)
    && saved.queue.every((id) => topic.words.some((w) => w.id === id))
    && (saved.phase !== "quiz" || saved.queue.length > saved.position && saved.position >= 0 && ["choice", "typing"].includes(saved.mode ?? ""));
  const stub = store.load<TrainerStub | null>(STUB_KEY, null);
  const snapshot: TrainerSnapshot = { thread: valid ? { ...saved, learned: Array.isArray(saved.learned) ? saved.learned : [] } : null, stub: stub && topicById(stub.topicId) ? stub : null };
  const next = expireSnapshot(snapshot, now);
  if (next !== snapshot || saved && !valid) saveSnapshot(store, next);
  return next;
}
