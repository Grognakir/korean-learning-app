"use client";

import { useEffect, useState } from "react";
import { readGame } from "../session";
import { EPISODES } from "./episodeList";
import { StoryGame } from "./StoryGame";
import type { Episode } from "./types";

const LAST_KEY = "lesson-sticker:interview:last";

/** Случайная ситуация, кроме последней сыгранной. */
export function pickEpisode(last: string | null, random: () => number = Math.random): Episode {
  const pool = EPISODES.length > 1 ? EPISODES.filter((e) => e.id !== last) : EPISODES;
  return pool[Math.floor(random() * pool.length)];
}

function readLast(): string | null {
  try {
    return localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}

/** Стикер урока 10: при каждом открытии — случайная ситуация с одеждой. */
export function InterviewGame() {
  const [episode, setEpisode] = useState(() => {
    // После перезагрузки продолжаем ту же ситуацию, а не берём новую.
    const saved = readGame("interview") as { episodeId?: unknown } | null;
    return EPISODES.find((e) => e.id === saved?.episodeId) ?? pickEpisode(readLast());
  });

  useEffect(() => {
    try {
      localStorage.setItem(LAST_KEY, episode.id);
    } catch {}
  }, [episode.id]);

  return (
    <StoryGame
      key={episode.id}
      episode={episode}
      progressKey="interview"
      onRestart={() => setEpisode(pickEpisode(episode.id))}
    />
  );
}
