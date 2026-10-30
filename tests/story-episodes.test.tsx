import { existsSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StoryGame } from "@/features/lessonSticker/story/StoryGame";
import { ITEM_BY_ID } from "@/features/lessonSticker/clothing/items";
import { EPISODES } from "@/features/lessonSticker/story/episodeList";
import { pickEpisode } from "@/features/lessonSticker/story/InterviewGame";
import { poseSrc } from "@/features/lessonSticker/story/types";
import { judge } from "@/features/lessonSticker/story/verdict";
import { TRAINERS } from "@/features/lessonSticker/trainers";

const PUBLIC = join(__dirname, "../public");

describe("ситуации диалоговой игры (2급 10과)", () => {
  it("16 ситуаций с уникальными id, тренажёр ждёт все", () => {
    expect(EPISODES).toHaveLength(16);
    expect(new Set(EPISODES.map((e) => e.id)).size).toBe(16);
    expect(TRAINERS.interview.total).toBe(EPISODES.length);
    expect(EPISODES.filter((e) => e.kind === "forJia").length).toBeGreaterThanOrEqual(6);
  });

  it("эталонный наряд каждой ситуации проходит проверку, а пустая корзина — нет", () => {
    for (const e of EPISODES) {
      expect(judge(e.rules, e.rules.example).ok, e.id).toBe(true);
      expect(judge(e.rules, []).ok, e.id).toBe(false);
    }
  });

  it("всё нужное есть в магазине, позы персонажей — в public", () => {
    for (const e of EPISODES) {
      for (const group of e.rules.required ?? []) {
        expect(group.anyOf.some((id) => e.assortment.includes(id)), `${e.id}: ${group.anyOf}`).toBe(true);
        for (const id of group.anyOf) expect(ITEM_BY_ID[id], id).toBeDefined();
      }
      for (const step of e.steps) {
        if (step.type === "line") expect(existsSync(join(PUBLIC, poseSrc(step.who, step.pose))), step.pose).toBe(true);
      }
      expect(existsSync(join(PUBLIC, poseSrc("jia", e.praise.pose ?? "happy")))).toBe(true);
      expect(e.steps.filter((s) => s.type === "shop")).toHaveLength(1);
    }
  });

  it("для 지아 мужской наряд не подходит, для игрока — женский", () => {
    const party = EPISODES.find((e) => e.id === "party")!;
    expect(judge(party.rules, party.rules.example).ok).toBe(true);
    const wedding = EPISODES.find((e) => e.id === "wedding")!;
    expect(judge(wedding.rules, [...wedding.rules.example, { id: "skirt", color: "black", pattern: "plain" }]).ok).toBe(
      false,
    );
  });

  it("случайный выбор не повторяет прошлую ситуацию", () => {
    for (const e of EPISODES) {
      for (const r of [0, 0.5, 0.999]) expect(pickEpisode(e.id, () => r).id).not.toBe(e.id);
    }
    const seen = new Set(Array.from({ length: 16 }, (_, i) => pickEpisode(null, () => i / 16).id));
    expect(seen.size).toBe(16);
  });

  it("у каждой ситуации свои ответы на приветствие и реакция 지아", () => {
    const made = EPISODES.filter((e) => e.id !== "interview");
    const firstReplies = made.map((e) => {
      const reply = e.steps.find((s) => s.type === "reply");
      return reply?.type === "reply" ? reply.options.map((o) => o.text).join("|") : "";
    });
    expect(new Set(firstReplies).size).toBe(made.length);
  });
});

describe("ответ клавиатурой", () => {
  it("стрелки двигают подсветку, Enter выбирает", () => {
    const wedding = EPISODES.find((e) => e.id === "wedding")!;
    render(<StoryGame episode={wedding} progressKey="test-keys" persist={false} />);
    fireEvent.click(screen.getByRole("button", { name: "[ START ]" }));
    for (let i = 0; i < 4 && !screen.queryByRole("group", { name: "Ваш ответ" }); i++) {
      fireEvent.click(screen.getByRole("button", { name: "▶ 다음" }));
    }
    const options = () => within(screen.getByRole("group", { name: "Ваш ответ" })).getAllByRole("button");
    expect(options()[0].getAttribute("aria-current")).toBe("true");
    fireEvent.keyDown(document.body, { key: "ArrowDown" });
    expect(options()[1].getAttribute("aria-current")).toBe("true");
    fireEvent.keyDown(document.body, { key: "ArrowDown" });
    expect(options()[0].getAttribute("aria-current")).toBe("true");
    fireEvent.keyDown(document.body, { key: "ArrowUp" });
    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(screen.queryByRole("group", { name: "Ваш ответ" })).toBeNull();
  });
});
