"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { buildSentence, objectParticle } from "../clothing/buildSentence";
import type { OutfitPiece } from "../clothing/situations";
import { readProgress, writeProgress } from "../progress";
import { readGame, writeGame } from "../session";
import { ITEM_BY_ID } from "../clothing/items";
import { Character, HologramFilter } from "./Character";
import { IncomingScreen } from "./IncomingScreen";
import { ShopScene, type ClerkLine } from "./ShopScene";
import { ChannelStatus, MatrixRain } from "./Terminal";
import { SPEAKERS, type Episode, type Speaker } from "./types";
import { useTypewriter } from "./useTypewriter";
import { judge } from "./verdict";
import styles from "./StoryGame.module.css";

type Line = { who: Speaker; pose: string; text: string; lang: "ko" | "ru"; ru?: string };

export const GREETING: ClerkLine = {
  pose: "smile",
  text: "뭘 드릴까요? 마네킹을 누르거나 원하시는 걸 말씀해 주세요.",
  ru: "Что вам подать? Нажмите на манекен или напишите, что хотите купить.",
};

type SavedGame = {
  index: number;
  cart: OutfitPiece[];
  clerk: ClerkLine;
  paid: boolean;
  verdictStep: number;
};

/** Сохранённый ход игры этой ситуации; всё непроверенное отбрасывается. */
function restoreGame(trainer: string, episodeId: string, stepCount: number): SavedGame | null {
  const raw = readGame(trainer) as Record<string, unknown> | null;
  if (!raw || raw.episodeId !== episodeId) return null;
  const index = raw.index;
  if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index >= stepCount) return null;
  const cart = Array.isArray(raw.cart)
    ? raw.cart.filter(
        (p): p is OutfitPiece =>
          Boolean(p) &&
          typeof p.id === "string" &&
          Boolean(ITEM_BY_ID[p.id]) &&
          typeof p.color === "string" &&
          typeof p.pattern === "string",
      )
    : [];
  const c = raw.clerk as Partial<ClerkLine> | undefined;
  const clerk =
    c && typeof c.pose === "string" && typeof c.text === "string"
      ? { pose: c.pose, text: c.text, ru: typeof c.ru === "string" ? c.ru : undefined }
      : GREETING;
  const verdictStep = typeof raw.verdictStep === "number" && raw.verdictStep >= 0 ? raw.verdictStep : 0;
  return { index, cart, clerk, paid: raw.paid === true, verdictStep };
}

export function StoryGame({
  episode,
  progressKey,
  onRestart,
  range,
  onRangeEnd,
  initialCart,
  persist = true,
  onFinish,
  className,
}: {
  episode: Episode;
  progressKey: string;
  /** «처음부터» после успеха: родитель подставляет другую ситуацию. */
  onRestart?: () => void;
  /** Только часть шагов (Solomon OS: звонок в окне телефона, встреча — отдельно). */
  range?: { from: number; to: number };
  /** Пройден последний шаг диапазона. */
  onRangeEnd?: () => void;
  /** Корзина, с которой начинается встреча (покупки из магазина ОС). */
  initialCart?: OutfitPiece[];
  /** Сохранять ход игры для перезагрузки (стикер урока); ОС хранит своё сама. */
  persist?: boolean;
  /** Итог встречи в ОС: вместо «처음부터 / 가게로 돌아가기» — «Mission completed» или «Перекупить». */
  onFinish?: (ok: boolean) => void;
  className?: string;
}) {
  const { steps, rules, assortment } = episode;
  const shopIndex = steps.findIndex((s) => s.type === "shop");

  // Ход игры после перезагрузки страницы: шаг, корзина, ответ продавца.
  const [saved] = useState(() => (persist ? restoreGame(progressKey, episode.id, steps.length) : null));
  const [index, setIndex] = useState(range?.from ?? saved?.index ?? 0);
  const [showRu, setShowRu] = useState(false);
  const [cart, setCart] = useState<OutfitPiece[]>(initialCart ?? saved?.cart ?? []);
  const [clerk, setClerk] = useState(saved?.clerk ?? GREETING);
  const [paid, setPaid] = useState(saved?.paid ?? false);
  const [verdictStep, setVerdictStep] = useState(saved?.verdictStep ?? 0);

  useEffect(() => {
    if (persist) writeGame(progressKey, { episodeId: episode.id, index, cart, clerk, paid, verdictStep });
  }, [persist, progressKey, episode.id, index, cart, clerk, paid, verdictStep]);

  const step = steps[index];
  const screenRef = useRef<HTMLDivElement>(null);

  // После смены шага фокус — на экран игры, чтобы Enter листал диалог, а не
  // нажимал крестик или кнопку, на которой фокус остался.
  useEffect(() => {
    const active = document.activeElement;
    if (active instanceof HTMLInputElement) return;
    if (step.type !== "incoming") screenRef.current?.focus({ preventScroll: true });
  }, [index, step.type]);

  useEffect(() => {
    for (const s of steps) {
      if (s.type === "line") new Image().src = `${SPEAKERS[s.who].base}/${s.pose}.webp`;
    }
    for (const pose of ["smile", "thinking", "bow", "happy", "angry", "facepalm"]) {
      const who = ["smile", "thinking", "bow"].includes(pose) ? "clerk" : "jia";
      new Image().src = `${SPEAKERS[who].base}/${pose}.webp`;
    }
  }, [steps]);

  const verdict = useMemo(() => judge(rules, cart), [rules, cart]);
  const verdictLines: Line[] = useMemo(() => {
    if (verdict.ok) {
      const { text, ru, pose = "happy" } = episode.praise;
      return [{ who: "jia", pose, lang: "ko", text, ru }];
    }
    const wrong = verdict.wrongKo;
    const forJia = episode.kind === "forJia";
    const backKo = forJia
      ? `이걸 입고 ${episode.placeKo} 갈 수 없어요. 다시 가게에 가 줄래요?`
      : `이렇게 ${episode.placeKo} 가면 안 돼요. 빨리 다시 가게에 가세요!`;
    const backRu = forJia
      ? `В этом я ${episode.placeRu} не пойду. Сходишь ещё раз в магазин?`
      : `Так ${episode.placeRu} нельзя. Быстро обратно в магазин!`;
    return [
      {
        who: "jia",
        pose: "angry",
        lang: "ko",
        text: `뭘 산 거예요?! 제가 ${episode.advice}${objectParticle(episode.advice)} ${forJia ? "사 달라고" : "사라고"} 했잖아요!`,
        ru: `Что ты купил?! Я же ${forJia ? "просила купить мне" : "говорила купить"}: ${episode.adviceRu}!`,
      },
      {
        who: "jia",
        pose: "facepalm",
        lang: "ko",
        text: `${wrong ? `그런데 이건 뭐예요? ${wrong}…` : forJia ? "제가 부탁한 옷이 없잖아요!" : "필요한 옷이 없잖아요!"} ${backKo}`,
        ru: `${wrong ? `А это что такое? ${verdict.wrongRu[0].toUpperCase()}${verdict.wrongRu.slice(1)}…` : forJia ? "Тут нет того, что я просила!" : "Тут же нет нужной одежды!"} ${backRu}`,
      },
    ];
  }, [verdict, episode]);

  let line: Line | null = null;
  if (step.type === "line") line = step;
  else if (step.type === "verdict") line = verdictLines[Math.min(verdictStep, verdictLines.length - 1)];
  else if (step.type === "reply") {
    for (let i = index; i >= 0; i--) {
      const s = steps[i];
      if (s.type === "line") {
        line = s;
        break;
      }
    }
  }
  const canTranslate = Boolean(line?.lang === "ko" && line.ru);
  const systemText = step.type === "system" ? step.lines.join("\n") : "";
  const typed = useTypewriter(line ? line.text : systemText);
  const verdictOver = step.type === "verdict" && verdictStep >= verdictLines.length;

  const next = () => {
    if (range && index >= range.to) {
      onRangeEnd?.();
      return;
    }
    setIndex((i) => Math.min(i + 1, steps.length - 1));
    setShowRu(false);
  };

  const restart = () => {
    if (onRestart) return onRestart();
    setIndex(0);
    setCart([]);
    setClerk(GREETING);
    setPaid(false);
    setVerdictStep(0);
    setShowRu(false);
  };

  const backToShop = () => {
    setIndex(shopIndex);
    setPaid(false);
    setClerk({ pose: "smile", text: "다시 오셨네요! 뭘 드릴까요?", ru: "Вы снова к нам! Что вам подать?" });
    setVerdictStep(0);
    setShowRu(false);
  };

  const advance = () => {
    if (step.type === "incoming") return next();
    if (step.type === "reply") {
      if (step.options.length === 1) next();
      return;
    }
    if (step.type === "shop") {
      if (paid) next();
      return;
    }
    if (!typed.done) return typed.finish();
    if (step.type === "verdict") {
      if (verdictOver) return;
      const last = verdictStep >= verdictLines.length - 1;
      if (last && verdict.ok) writeProgress(progressKey, [...new Set([...readProgress(progressKey), episode.id])]);
      setVerdictStep((v) => v + 1);
      setShowRu(false);
      return;
    }
    next();
  };

  const choose = (i: number) => {
    if (step.type === "reply" && i < step.options.length) next();
  };

  const advanceRef = useRef(advance);
  const choiceRef = useRef(choose);
  useEffect(() => {
    advanceRef.current = advance;
    choiceRef.current = choose;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (/^[1-9]$/.test(e.key)) {
        choiceRef.current(Number(e.key) - 1);
        return;
      }
      if (e.key !== "Enter" && e.key !== " ") return;
      if (target?.closest("button, a")) return;
      e.preventDefault();
      advanceRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const live = step.type === "verdict";
  // Место встречи — последняя системная строка перед вердиктом («회사 앞»).
  const lastSystem = steps.findLast((s) => s.type === "system");
  const meeting = lastSystem?.type === "system" ? (lastSystem.lines.at(-1) ?? "") : "";
  const scene =
    step.type === "verdict" || (step.type === "system" && index > shopIndex)
      ? meeting
      : index > steps.findIndex((s) => s.type === "system")
        ? "ONLINE STORE"
        : "CALL";
  const showNext =
    step.type === "line" ||
    step.type === "system" ||
    (step.type === "verdict" && !verdictOver);

  if (step.type === "incoming") {
    return (
      <div className={`${styles.screen} ${styles.screenIncoming}`} data-game-screen>
        <IncomingScreen caller={step.caller} avatar={step.avatar} onStart={next} />
      </div>
    );
  }

  return (
    <div className={`${styles.screen} ${className ?? ""}`} ref={screenRef} tabIndex={-1} data-game-screen>
      <HologramFilter />
      <header className={styles.bar}>
        <span>KOREAN LEARNING // {scene}</span>
        <span>{live ? "LIVE" : "REMOTE ●"}</span>
      </header>

      {step.type === "shop" ? (
        <ShopScene
          assortment={assortment}
          cart={cart}
          setCart={setCart}
          clerk={clerk}
          setClerk={setClerk}
          paid={paid}
          onPay={() => {
            setPaid(true);
            setClerk({ pose: "bow", text: "감사합니다! 안녕히 가세요.", ru: "Спасибо! До свидания." });
          }}
          onNext={next}
        />
      ) : (
        <>
      <div
        className={`${styles.stage} ${live && episode.background ? styles.stageLive : ""}`}
        style={live && episode.background ? ({ "--bg": `url(${episode.background})` } as CSSProperties) : undefined}
      >
        {!live && <MatrixRain className={styles.rainStage} />}
        {!live && (
          <ChannelStatus
            key={scene}
            title={scene === "CALL" ? "● CALL" : "● LINK"}
            withTimer
            ended={step.type === "system" && step.lines[0] === "CALL ENDED"}
            className={styles.stageStatus}
          />
        )}
        {line && (
          <Character
            key={`${line.who}-${live ? "live" : "remote"}`}
            who={line.who}
            pose={line.pose}
            presence={live ? "live" : "remote"}
          />
        )}
        {verdictOver && (
          // Итог — блоком на сцене рядом с 지아, чтобы высота экрана не менялась.
          <div className={styles.verdictCard}>
            {verdict.ok ? (
              <>
                <p className={styles.complete}>MISSION COMPLETE</p>
                <p className={`${styles.verdictSentence} kr`}>{buildSentence(rules, cart)}</p>
              </>
            ) : (
              <>
                <span className={styles.verdictTitle}>ЧТО ИСПРАВИТЬ</span>
                <ul className={styles.notes}>
                  {verdict.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
        {step.type === "reply" && (
          <div className={styles.replies} role="group" aria-label="Ваш ответ">
            <span className={styles.repliesLabel}>ВАШ ОТВЕТ</span>
            {step.options.map((o, i) => (
              <button key={o.text} type="button" className={styles.reply} onClick={next}>
                <span className={styles.replyKey}>{i + 1}</span>
                <span className={styles.replyText}>
                  <span className={o.ru ? "kr" : undefined}>&gt; {o.text}</span>
                  {o.ru && <span className={styles.replyRu}>{o.ru}</span>}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {(line || step.type === "system") && (
        <div
          className={styles.dialogue}
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest("button")) advance();
          }}
        >
          <div className={styles.nameRow}>
            <span className={`${styles.nameTag} kr`}>{line ? SPEAKERS[line.who].name : "SYSTEM"}</span>
            <button
                type="button"
                className={styles.ruToggle}
                aria-pressed={canTranslate && showRu}
                disabled={!canTranslate}
                onClick={() => setShowRu((v) => !v)}
              >
                RU
              </button>
          </div>
          <div className={styles.lineBody}>
          {step.type === "system" ? (
            <ul className={styles.systemLog}>
              {typed.shown.split("\n").map((row, i, rows) => (
                <li key={i} className={`${/[가-힣]/.test(row) ? "kr" : ""} ${row === "CALL ENDED" ? styles.systemAlert : ""}`}>
                  {row}
                  {i === rows.length - 1 && typed.done && <span className={styles.cursor} />}
                </li>
              ))}
            </ul>
          ) : (
            <p className={`${styles.lineText} ${line?.lang === "ko" ? "kr" : ""}`}>
              {line && step.type === "reply" ? line.text : typed.shown}
              {(step.type === "reply" || typed.done) && <span className={styles.cursor} />}
            </p>
          )}
          {canTranslate && showRu && <p className={styles.lineRu}>{line?.ru}</p>}
          </div>
          <div className={styles.dialogueActions}>
            {showNext && (
              <button type="button" className={styles.nextButton} onClick={advance}>
                ▶ 다음
              </button>
            )}
            {verdictOver && onFinish && (
              <button
                type="button"
                className={`${styles.nextButton} ${styles.withIcon} ${verdict.ok ? "" : "kr"}`}
                onClick={() => onFinish(verdict.ok)}
              >
                {verdict.ok ? "Mission completed ▶" : (
                  <>
                    <RetryIcon />
                    다시 사기 · Перекупить
                  </>
                )}
              </button>
            )}
            {verdictOver &&
              !onFinish &&
              (verdict.ok ? (
                <button type="button" className={`${styles.nextButton} ${styles.withIcon} kr`} onClick={restart}>
                  <RetryIcon />
                  처음부터
                </button>
              ) : (
                <button type="button" className={`${styles.nextButton} ${styles.withIcon} kr`} onClick={backToShop}>
                  <RetryIcon />
                  가게로 돌아가기
                </button>
              ))}
          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
}

function RetryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4.5 7.5A6.5 6.5 0 1 1 3.5 11" strokeLinecap="round" />
      <path d="M4 2.5v5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
