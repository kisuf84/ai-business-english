export type SpeakingTopicsItem = {
  id: string;
  slug: string;
  title: string;
  sourceFile: string;
};

const ITEM: SpeakingTopicsItem = {
  id: "speaking-topics",
  slug: "speaking-topics",
  title: "English Speaking Topics",
  sourceFile: "speaking-topics.html",
};

const ITEMS: SpeakingTopicsItem[] = [ITEM];

/**
 * Exact client-provided copy, verbatim from "TAGLINES.pdf" (delivered
 * 2026-08-20 with the final Aug 19 icon package). Do not rewrite.
 */
export const SPEAKING_TOPICS_HEADLINE = "Speak More. Think Deeper. Communicate Better.";

export const SPEAKING_TOPICS_DESCRIPTION =
  "Build your confidence with 500+ engaging speaking topics designed to get you talking. Explore 250 General topics and 250 Business topics, each featuring 30 carefully designed questions to help you express ideas, share opinions, discuss real-life situations, and develop natural, confident English.";

export const SPEAKING_TOPICS_CLOSING =
  "Find your topic. Start the conversation. Make English your voice.";

export function getSpeakingTopicsItem(): SpeakingTopicsItem {
  return ITEM;
}
