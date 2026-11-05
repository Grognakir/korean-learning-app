"use client";

import { useState } from "react";
import os from "../SolomonOs.module.css";
import { TOPICS, topicById, wordById } from "./topics";
import { threadTopic, type TrainerMessage } from "./thread";
import type { WordTopic } from "./topics";
import type { WordTrainerController } from "./useWordTrainer";
import styles from "./WordTrainer.module.css";

export function TrainerProgress({ trainer }: { trainer: WordTrainerController }) {
  const thread = trainer.thread;
  if (thread?.phase !== "quiz") return null;
  const total = threadTopic(thread)!.words.length;
  return <div className={styles.progress}><span className="kr">{thread.topicId === "personal" ? "내 단어장 · " : ""}복습 · {thread.learned.length}/{total} · 정답 {thread.correct}</span><button type="button" onClick={trainer.stop}>그만하기</button></div>;
}
function Bubble({ message, topic, showRu }: { message: TrainerMessage; topic: WordTopic; showRu: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const word = message.wordId ? wordById(topic, message.wordId) : null;
  const content = word ? <>Что значит {word.group === "verb" ? "глагол ношения " : ""}«<strong className="kr">{word.ko}</strong>»?</> : message.text ?? message.ko;
  const translated = Boolean(message.ru && (showRu || expanded));
  return <div className={`${os.msg} ${message.who === "out" ? os.msgOut : os.msgIn} ${styles.bubble}`}>
    {message.ru ? <button type="button" className={styles.messageText} aria-label={`Перевод сообщения: ${message.ko}`} aria-expanded={translated} onClick={() => setExpanded((v) => !v)}><span className="kr">{content}</span></button> : <span>{content}</span>}
    {message.ru && <span className={`${os.tr} ${translated ? styles.translation : ""}`}>{message.ru}</span>}
    {message.correction && <span className={styles.correction}>{message.correction}</span>}
    <span className={os.st}>{message.who === "out" ? "읽음 · " : ""}{new Date(message.at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
  </div>;
}
export function TrainerMessages({ trainer, showRu }: { trainer: WordTrainerController; showRu: boolean }) {
  const thread = trainer.thread;
  const stubTopic = trainer.stub && topicById(trainer.stub.topicId);
  return <>
    {stubTopic && <div className={styles.stub}><span>Отработка темы «{stubTopic.titleRu}»</span><small className="kr">{stubTopic.titleKo} 복습</small></div>}
    {thread?.log.map((message, index) => {
      const attachment = message.attachment && threadTopic(thread);
      return attachment ? <div key={`${thread.startedAt}-${index}`} className={`${os.msg} ${os.msgIn} ${styles.bubble}`}><button type="button" className={styles.attachment} onClick={() => trainer.openDocument(attachment.id)} aria-label={`Открыть документ: ${attachment.titleRu}`}><svg viewBox="0 0 24 28" aria-hidden="true"><path d="M3 1h12l6 6v20H3zM15 1v7h6M7 13h10M7 18h10M7 23h7"/></svg><span><b className="kr">{attachment.titleKo} · 단어장</b><small>Документ · {attachment.document.length} разделов</small></span></button></div>
        : <Bubble key={`${thread.startedAt}-${index}`} message={message} topic={threadTopic(thread) ?? TOPICS[0]} showRu={showRu}/>;
    })}
    {trainer.typing && <div className={os.typing} role="status">지아 입력 중<i/><i/><i/></div>}
  </>;
}
function Reply({ ko, ru, onClick }: { ko: string; ru: string; onClick: () => void }) {
  return <button type="button" className={`${os.reply} ${styles.reply}`} onClick={onClick}><span className="kr">{ko}</span><span className={os.tr}>{ru}</span></button>;
}
export function TrainerStart({ onStart }: { onStart: () => void }) {
  return <Reply ko="단어를 복습하고 싶어요." ru="Хочу повторить слова." onClick={onStart}/>;
}
export function TrainerReplies({ trainer }: { trainer: WordTrainerController }) {
  const thread = trainer.thread;
  if (!thread) return null;
  return <div className={styles.answers} role="group" aria-label="Ваш ответ">
    {thread.phase === "askTopic" && <>{TOPICS.map((topic) => <Reply key={topic.id} ko={topic.titleKo} ru={topic.titleRu} onClick={() => trainer.topic(topic.id)}/>)}<Reply ko="다음에 할게요." ru="Потом." onClick={trainer.cancel}/></>}
    {thread.phase === "docSent" && <><Reply ko="준비됐어요!" ru="Я готов к проверке." onClick={trainer.ready}/><Reply ko="아직이에요." ru="Ещё читаю." onClick={trainer.later}/></>}
    {thread.phase === "askMode" && <><Reply ko="보기 중에서 고르기" ru="Выбирать из вариантов" onClick={() => trainer.mode("choice")}/><Reply ko="직접 쓰기" ru="Писать самому" onClick={() => trainer.mode("typing")}/></>}
    {thread.phase === "completed" && <><Reply ko="끝내기" ru="Завершить" onClick={trainer.stop}/><Reply ko="다시 하기" ru="Повторить" onClick={trainer.restart}/></>}
    {thread.phase === "quiz" && <>
      {!trainer.typing && (thread.mode === "choice" ? <div className={styles.choices}>{thread.choices.map((answer) => <button type="button" key={answer} className={`${os.reply} ${styles.reply}`} onClick={() => trainer.answer(answer)}>{answer}</button>)}</div> : <form className={styles.inputForm} onSubmit={(event) => { event.preventDefault(); trainer.answer(thread.draft); }}><label>Введите перевод<input type="text" value={thread.draft} onChange={(event) => trainer.draft(event.target.value)} aria-label="Введите перевод" autoComplete="off" autoCapitalize="none" enterKeyHint="send"/></label><button type="submit" className={styles.primary} disabled={!thread.draft.trim()}>Отправить</button></form>)}
      <Reply ko="그만하기" ru="Закончить" onClick={trainer.stop}/>
    </>}
  </div>;
}
