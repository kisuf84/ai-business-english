import { resolveCuratedFilePath } from "./contentLibraries";

const LIBRARY = "speaking-topics" as const;

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

export function getSpeakingTopicsItem(): SpeakingTopicsItem {
  return ITEM;
}

export async function getSpeakingTopicsFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, ITEMS, slug);
}
