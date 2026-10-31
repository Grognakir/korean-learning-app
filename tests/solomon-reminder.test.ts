import { describe, expect, it } from "vitest";
import { EPISODES } from "@/features/lessonSticker/story/episodeList";
import { INTERVIEW_EPISODE } from "@/features/lessonSticker/story/interviewEpisode";
import { callRange, reminderEpisode, requestLines } from "@/features/solomonOs/trainers";

describe("повторный звонок 지아", () => {
  it("просьба — корейские реплики перед ответом игрока", () => {
    expect(requestLines(INTERVIEW_EPISODE).map((l) => l.ko)).toEqual([
      "면접에는 깔끔하고 단정한 옷을 입어야 해요.",
      "검은색이나 남색 정장을 입고 흰색 와이셔츠를 입으세요. 넥타이도 매고 까만 구두를 신으세요.",
      "청바지나 운동화는 안 돼요. 알겠지요?",
    ]);
  });

  it("у каждой ситуации есть просьба с переводом", () => {
    for (const episode of EPISODES) {
      const lines = requestLines(episode);
      expect(lines.length, episode.id).toBeGreaterThan(0);
      for (const l of lines) expect(l.ru, `${episode.id}: ${l.ko}`).toBeTruthy();
    }
  });

  it("напоминание повторяет просьбу и заканчивается звонком, эпизод тот же", () => {
    for (const episode of EPISODES) {
      const reminder = reminderEpisode(episode);
      expect(reminder.id).toBe(episode.id);
      const range = callRange(reminder);
      const end = reminder.steps[range.to];
      expect(end).toMatchObject({ type: "system", lines: ["CALL ENDED"] });
      const said = reminder.steps
        .slice(range.from, range.to)
        .flatMap((s) => (s.type === "line" ? [s.text] : []));
      for (const l of requestLines(episode)) expect(said).toContain(l.ko);
      expect(said[0]).toBe("여보세요? 또 전화했네요. 무슨 일이에요?");
    }
  });
});
