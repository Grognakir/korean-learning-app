"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { flushSync } from "react-dom";
import { describePiece } from "../clothing/buildSentence";
import { ClothingIcon } from "../clothing/ClothingIcon";
import { ITEM_BY_ID } from "../clothing/items";
import type { OutfitPiece } from "../clothing/situations";
import { Character } from "./Character";
import { ItemPicker } from "./ItemPicker";
import { MannequinRow, type ZoneAnchor } from "./Mannequin";
import { zoneItems, type MannequinKind, type ZoneId } from "./mannequins";
import { Palette } from "./Palette";
import { parsePurchase, type PurchaseResult } from "./parsePurchase";
import { backspace, typeJamo } from "./hangul";
import { KoreanKeyboard } from "./KoreanKeyboard";
import { ChannelStatus, MatrixRain } from "./Terminal";
import { TypingPanel } from "./TypingPanel";
import { useCompact, useShopLayout } from "./usePhone";
import { useTypewriter } from "./useTypewriter";
import styles from "./StoryGame.module.css";

export type ClerkLine = { pose: string; text: string; ru?: string };

type Selection = { kind: MannequinKind; zone: ZoneId };

export function ShopScene({
  assortment,
  cart,
  setCart,
  clerk,
  setClerk,
  paid,
  onPay,
  onNext,
}: {
  assortment: string[];
  cart: OutfitPiece[];
  setCart: Dispatch<SetStateAction<OutfitPiece[]>>;
  clerk: ClerkLine;
  setClerk: (line: ClerkLine) => void;
  paid: boolean;
  onPay: () => void;
  onNext: () => void;
}) {
  const [selection, setSelection] = useState<Selection | null>(null);
  // Узкий экран игры (телефон или узкое окно ОС): полка — шторка снизу сцены,
  // иначе — в окне диалога.
  const stageRef = useRef<HTMLDivElement>(null);
  const phone = useCompact(stageRef);
  const layout = useShopLayout(stageRef);
  const shelfOnStage = phone || layout === "wide";
  const [cartOpen, setCartOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [showRu, setShowRu] = useState(false);
  const typed = useTypewriter(clerk.text);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Поле растёт по тексту (до трёх строк, предел — max-height в CSS).
  useLayoutEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [input, typing]);

  const respond = (result: PurchaseResult) => {
    setShowRu(false);
    if (result.kind === "foreign") {
      setClerk(
        result.lang === "ru"
          ? {
              pose: "thinking",
              text: "죄송해요, 저는 러시아어를 못해요. 한국어로 말씀해 주세요.",
              ru: "Извините, я не говорю по-русски. Скажите, пожалуйста, по-корейски.",
            }
          : {
              pose: "thinking",
              text: "죄송해요, 저는 영어를 못해요. 한국어로 말씀해 주세요.",
              ru: "Извините, я не говорю по-английски. Скажите, пожалуйста, по-корейски.",
            },
      );
    } else if (result.kind === "unknown") {
      setClerk({
        pose: "thinking",
        text: "죄송해요, 그건 없어요.",
        ru: "Извините, такого у нас нет.",
      });
    } else if (result.kind === "needColor") {
      setClerk({
        pose: "thinking",
        text: `${ITEM_BY_ID[result.id].ko}요? 무슨 색으로 드릴까요?`,
        ru: `${ITEM_BY_ID[result.id].ko}? Какого цвета?`,
      });
    } else {
      const piece = result.piece;
      setCart((c) => [...c.filter((p) => p.id !== piece.id), piece]);
      setClerk({
        pose: "smile",
        text: `네, ${describePiece(piece)} 여기 있어요.`,
        ru: "Да, вот, пожалуйста.",
      });
    }
  };

  const select = ({ kind, zone }: ZoneAnchor) => {
    setSelection({ kind, zone });
    setPicked(null);
    setTyping(false);
  };

  const closeShelf = () => {
    setSelection(null);
    setPicked(null);
  };

  const items = selection
    ? zoneItems(selection.kind, selection.zone, assortment)
    : [];
  const picker = selection && (
    <ItemPicker
      zone={selection.zone}
      items={items}
      picked={picked}
      onPick={setPicked}
    />
  );

  const cartList = (
    <div
      className={`${styles.cartPanel} ${cartOpen ? styles.cartOpen : ""}`}
      aria-label="Корзина"
    >
      <div className={styles.cartHead}>
        {/* На телефоне заголовок раскрывает список покупок. */}
        <button
          type="button"
          className={styles.cartTitle}
          aria-expanded={cartOpen}
          onClick={() => setCartOpen((v) => !v)}
        >
          CART·{cart.length}
          <svg
            className={styles.cartArrow}
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path
              d="M3 5l4 4 4-4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className={styles.cartClear}
          disabled={cart.length === 0 || paid}
          onClick={() => setCart([])}
        >
          очистить
        </button>
      </div>
      <div className={styles.cartRows}>
        {cart.length === 0 && (
          <span className={`${styles.hint} kr`}>장바구니가 비어 있어요</span>
        )}
        {cart.map((p) => (
          <span key={p.id} className={styles.cartRow}>
            <ClothingIcon
              id={p.id}
              color={p.color}
              pattern={p.pattern}
              size={28}
            />
            <span className="kr">{describePiece(p)}</span>
            <button
              type="button"
              className={styles.remove}
              disabled={paid}
              onClick={() => setCart((c) => c.filter((x) => x.id !== p.id))}
              aria-label={`Убрать ${describePiece(p)}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <button
        type="button"
        className={`${styles.checkout} kr`}
        disabled={cart.length === 0 || paid}
        onClick={onPay}
      >
        계산할게요
      </button>
    </div>
  );

  const shelfOpen = selection && !typing && !paid;
  const shelfInBox = shelfOpen && !shelfOnStage;
  const sidePanel = !phone && layout === "wide" && !paid;
  const send = () => {
    if (!input.trim()) return;
    respond(parsePurchase(input, assortment));
    setInput("");
    setTyping(false);
  };
  // Телефон, игрок пишет сам: вместо сцены — чат с продавцом и подсказки,
  // строка ввода остаётся прямо над клавиатурой.
  const chatMode = typing && phone && !paid;
  const canTranslate = Boolean(clerk.ru) && !typing && !shelfInBox;

  return (
    <>
      <div
        className={`${styles.stage} ${styles.shopStage} ${chatMode ? styles.stageHidden : ""}`}
        ref={stageRef}
        data-layout={phone ? "phone" : layout}
      >
        <MatrixRain className={styles.rainStage} />
        <Character who="clerk" pose={clerk.pose} presence="remote" />
        <MannequinRow
          compact={phone}
          calloutsLeft={!phone && layout === "wide"}
          zonesHidden={Boolean(shelfOpen) && phone}
          kinds={["male", "female"]}
          selected={selection}
          hideCallouts={Boolean(picked)}
          onSelect={select}
          onDeselect={closeShelf}
        />

        <div className={styles.shopSide}>
          <ChannelStatus title="● LINK" withTimer />
          {cartList}
        </div>

        {/* Пока открыта карточка вещи, шторка с полкой спрятана. На широкой
            сцене полка стоит всегда: без выбранной зоны — подсказка. */}
        {!picked && (shelfOpen ? shelfOnStage : sidePanel) && (
          <div className={styles.shelfSheet}>
            {shelfOpen ? (
              <>
                <button
                  type="button"
                  className={styles.shelfClose}
                  onClick={closeShelf}
                  aria-label="Закрыть полку"
                >
                  ×
                </button>
                {picker}
              </>
            ) : (
              <div className={styles.shelfEmpty}>
                <span className="kr">부위를 선택하세요</span>
                <small>
                  Нажмите на часть манекена — здесь появятся вещи для неё.
                </small>
              </div>
            )}
          </div>
        )}

        {picked && selection && !paid && (
          <Palette
            key={picked}
            id={picked}
            onClose={() => setPicked(null)}
            onBuy={(result) => {
              respond(result);
              // После покупки полка закрывается, чтобы был виден ответ продавца.
              if (result.kind === "ok") closeShelf();
            }}
          />
        )}
      </div>

      {chatMode && (
        <TypingPanel
          cartCount={cart.length}
          assortment={assortment}
          onPhrase={setInput}
        />
      )}

      <div
        className={`${styles.dialogue} ${styles.dialogueShop} ${chatMode ? styles.dialogueChat : ""}`}
      >
        <div className={styles.nameRow}>
          <span className={`${styles.nameTag} kr`}>
            {typing && !paid ? "나" : "점원"}
          </span>
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
        {shelfInBox ? (
          <>
            <button
              type="button"
              className={styles.shelfClose}
              onClick={closeShelf}
              aria-label="Закрыть полку"
            >
              ×
            </button>
            {picker}
          </>
        ) : (
          <>
            {chatMode ? (
              // Телефон: своя клавиатура снизу, поле — просто надпись с
              // курсором. Фокуса браузера нет, поэтому iOS не показывает свою
              // клавиатуру и строки над ней и не сдвигает страницу.
              <div className={styles.prompt}>
                <span aria-hidden>&gt;</span>
                <div
                  role="textbox"
                  aria-label="Что купить"
                  className={`${styles.terminalInput} ${styles.fakeInput} kr`}
                >
                  {input || (
                    <span className={styles.fakePlaceholder}>
                      검은색 정장 주세요
                    </span>
                  )}
                  <span className={styles.cursor} />
                </div>
              </div>
            ) : typing && !paid ? (
              // Игрок пишет прямо на месте реплики продавца. Поле —
              // однострочный textarea без формы: у него iOS не показывает
              // панель «Passwords / Cards / Data» и стрелки «пред./след.».
              <div className={styles.prompt}>
                <span aria-hidden>&gt;</span>
                <textarea
                  ref={inputRef}
                  rows={1}
                  className={`${styles.terminalInput} kr`}
                  value={input}
                  onChange={(e) => setInput(e.target.value.replace(/\n/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setTyping(false);
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="검은색 정장 주세요"
                  aria-label="Что купить"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  enterKeyHint="send"
                  // Без подсказок iOS «Help with text / Fix / Rewrite».
                  {...{ writingsuggestions: "false" }}
                  autoFocus
                />
              </div>
            ) : (
              // Реплика прокручивается внутри: в низком окне кнопки снизу
              // остаются на месте.
              <div className={styles.lineBody}>
                <p className={`${styles.lineText} kr`}>
                  {typed.shown}
                  {typed.done && <span className={styles.cursor} />}
                </p>
                {clerk.ru && showRu && (
                  <p className={styles.lineRu}>{clerk.ru}</p>
                )}
              </div>
            )}
            <div className={styles.dialogueActions}>
              {!paid &&
                (typing ? (
                  <>
                    <button
                      type="button"
                      className={`${styles.ghost} ${styles.iconButton}`}
                      onClick={() => {
                        setTyping(false);
                        setInput("");
                      }}
                      aria-label="Отменить ввод"
                      title="Вернуться к словам продавца (Esc)"
                    >
                      <BackIcon />
                    </button>
                    <button
                      type="button"
                      className={`${styles.ghost} ${styles.iconButton}`}
                      aria-label="Enter"
                      onClick={send}
                    >
                      <EnterIcon />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={`${styles.ghost} ${styles.iconButton}`}
                    onClick={() => {
                      // Поле появляется и получает фокус в том же касании —
                      // иначе iOS не открывает клавиатуру.
                      flushSync(() => {
                        setTyping(true);
                        setSelection(null);
                        setPicked(null);
                      });
                      inputRef.current?.focus();
                    }}
                    title="Написать фразу самому"
                    aria-label="Написать фразу самому"
                  >
                    <KeyboardIcon />
                  </button>
                ))}
              {paid && (
                <button
                  type="button"
                  className={styles.nextButton}
                  onClick={onNext}
                >
                  ▶ 다음
                </button>
              )}
            </div>
          </>
        )}
      </div>
      {chatMode && (
        <KoreanKeyboard
          onJamo={(jamo) => setInput((t) => typeJamo(t, jamo))}
          onSpace={() =>
            setInput((t) => (!t.trim() || t.endsWith(" ") ? t : `${t} `))
          }
          onBackspace={() => setInput(backspace)}
          onSend={send}
        />
      )}
    </>
  );
}

function KeyboardIcon() {
  return (
    <svg
      width="30"
      height="20"
      viewBox="0 0 30 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <rect x="1" y="1" width="28" height="18" rx="2.5" />
      <path
        d="M5 6h2M10 6h2M15 6h2M20 6h2M25 6h0M5 10h2M10 10h2M15 10h2M20 10h4M8 14.5h14"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EnterIcon() {
  return (
    <svg
      width="30"
      height="20"
      viewBox="0 0 30 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        d="M25 2v8a3 3 0 0 1-3 3H5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 8l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      width="30"
      height="20"
      viewBox="0 0 30 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        d="M10 4L4 10l6 6M4 10h22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
