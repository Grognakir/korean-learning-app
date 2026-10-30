"use client";

import { useState, type SetStateAction } from "react";
import type { OutfitPiece } from "../../lessonSticker/clothing/situations";
import { HologramFilter } from "../../lessonSticker/story/Character";
import { ShopScene, type ClerkLine } from "../../lessonSticker/story/ShopScene";
import { GREETING } from "../../lessonSticker/story/StoryGame";
import storyStyles from "../../lessonSticker/story/StoryGame.module.css";
import { episodeById, type OsTask } from "../trainers";
import styles from "../SolomonOs.module.css";

/** 쇼핑: онлайн-магазин из игры урока 10 для текущего задания. Корзина живёт в
 * задании ОС, поэтому переживает закрытие окна. «계산할게요» — встреча с 지아. */
export function Shop({
  task,
  onCart,
  onPay,
}: {
  task: OsTask | null;
  onCart: (cart: OutfitPiece[]) => void;
  onPay: () => void;
}) {
  const [clerk, setClerk] = useState<ClerkLine>(GREETING);
  const episode = task && episodeById(task.episodeId);

  if (!task || !episode) {
    return (
      <div className={`${styles.lockbox} kr`}>
        <div>
          <b>🛍️</b>
          지금은 살 게 없어요.
          <br />
          <small>Сейчас покупать нечего — задание придёт со звонком.</small>
        </div>
      </div>
    );
  }

  const setCart = (next: SetStateAction<OutfitPiece[]>) =>
    onCart(typeof next === "function" ? next(task.cart) : next);

  return (
    <div className={`${storyStyles.screen} ${storyStyles.embedded}`}>
      <HologramFilter />
      <header className={storyStyles.bar}>
        <span>KOREAN LEARNING // ONLINE STORE</span>
        <span>REMOTE ●</span>
      </header>
      <ShopScene
        assortment={episode.assortment}
        cart={task.cart}
        setCart={setCart}
        clerk={clerk}
        setClerk={setClerk}
        paid={false}
        onPay={onPay}
        onNext={() => {}}
      />
    </div>
  );
}
