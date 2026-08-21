import { resolveCuratedFilePath } from "./contentLibraries";
import { listGossipEnglishItems } from "./gossipEnglish";

const LIBRARY = "gossip-english" as const;

/**
 * File-resolver companion to gossipEnglish.ts — see businessIndustries.files.ts
 * for why this is split out. Only app/content/[library]/[slug]/route.ts
 * should import this file.
 */
export async function getGossipEnglishFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, listGossipEnglishItems(), slug);
}
