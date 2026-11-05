"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReadableDocument } from "../documents/types";
import { readDictionary, saveAnswer } from "../dictionary/entries";
import { dictionaryTopic } from "../dictionary/topic";
import { useOsStore } from "../OsStorage";
import { advanceQuestion, answerWord, chooseMode, chooseTopic, expireSnapshot, finishThread, isActive, readLater, readTrainer, readyThread, restartThread, saveSnapshot, startThread, threadTopic, type TrainerMode, type TrainerSnapshot, type TrainerThread } from "./thread";

export function useWordTrainer(onOpenDocument?: (document: ReadableDocument) => void) {
  const store = useOsStore();
  const [snapshot, setSnapshot] = useState(() => readTrainer(store));
  const current = useRef(snapshot);
  const commit = useCallback((next: TrainerSnapshot) => {
    current.current = next;
    saveSnapshot(store, next);
    setSnapshot(next);
  }, [store]);
  const expire = useCallback(() => {
    const next = expireSnapshot(current.current);
    if (next !== current.current) commit(next);
  }, [commit]);
  const update = useCallback((transition: (thread: TrainerThread) => TrainerThread) => {
    const before = current.current;
    const live = expireSnapshot(before);
    if (live !== before) { commit(live); return; }
    if (live.thread) commit({ ...live, thread: transition(live.thread) });
  }, [commit]);
  useEffect(() => {
    const timer = setInterval(expire, 30_000);
    const visible = () => { if (document.visibilityState === "visible") expire(); };
    document.addEventListener("visibilitychange", visible);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [expire]);
  const thread = snapshot.thread;
  useEffect(() => {
    if (thread?.phase !== "quiz" || !thread.awaitingQuestion) return;
    const delay = thread.queue[thread.position] === thread.queue[thread.position + 1] ? 3000 : 800;
    const timer = setTimeout(() => update(advanceQuestion), delay);
    return () => clearTimeout(timer);
  }, [thread?.phase, thread?.awaitingQuestion, thread?.updatedAt, thread?.position, thread?.queue, update]);
  return {
    ...snapshot, active: isActive(thread), typing: Boolean(thread?.phase === "quiz" && thread.awaitingQuestion),
    start: () => commit({ thread: startThread(), stub: null }),
    topic: (id: string) => update((t) => chooseTopic(t, id, Date.now(), id === "personal" ? dictionaryTopic(readDictionary(store)) : undefined)),
    ready: () => update(readyThread),
    later: () => update(readLater),
    mode: (mode: TrainerMode) => update((t) => chooseMode(t, mode)),
    answer: (input: string) => update((t) => {
      const next = answerWord(t, input);
      if (t.topicId === "personal" && next.answered > t.answered) saveAnswer(store, t.queue[t.position], next.correct > t.correct);
      return next;
    }),
    draft: (draft: string) => update((t) => t.phase === "quiz" && !t.awaitingQuestion ? { ...t, draft } : t),
    stop: () => update((t) => finishThread(t)),
    restart: () => update(restartThread),
    cancel: () => update((t) => finishThread(t, true)),
    openDocument: (topicId: string) => {
      expire();
      const live = current.current.thread;
      const topic = live && live.topicId === topicId ? threadTopic(live) : undefined;
      if (current.current.thread && topic) onOpenDocument?.({ id: `word-trainer:${topic.id}`, titleKo: `${topic.titleKo} · 단어장`, titleRu: topic.titleRu, source: "메시지 · 지아", sections: topic.document });
    },
  };
}
export type WordTrainerController = ReturnType<typeof useWordTrainer>;
