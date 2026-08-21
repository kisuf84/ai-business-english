import { resolveCuratedFilePath } from "./contentLibraries";
import { getSpeakingTopicsItem } from "./speakingTopics";

const LIBRARY = "speaking-topics" as const;

/**
 * File-resolver companion to speakingTopics.ts — see
 * businessIndustries.files.ts for why this is split out. Only
 * app/content/[library]/[slug]/route.ts should import this file.
 */
export async function getSpeakingTopicsFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, [getSpeakingTopicsItem()], slug);
}
