"use client";

import { INTERVIEW_EPISODE } from "./interviewEpisode";
import { StoryGame } from "./StoryGame";

export function InterviewGame() {
  return <StoryGame episode={INTERVIEW_EPISODE} progressKey="interview" />;
}
