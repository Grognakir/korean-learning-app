"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export type StickerTrainer = {
  title: string;
  /** Сколько заданий нужно пройти, чтобы тренажёр считался пройденным. */
  total: number;
  Component: ComponentType;
};

export const TRAINERS: Record<string, StickerTrainer> = {
  interview: {
    title: "Входящий звонок",
    total: 1,
    Component: dynamic(() => import("./story/InterviewGame").then((m) => m.InterviewGame)),
  },
};
