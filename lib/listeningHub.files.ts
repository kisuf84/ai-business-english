import { resolveCuratedFilePath } from "./contentLibraries";
import { getListeningHubItem } from "./listeningHub";

const LIBRARY = "listening-hub" as const;

/**
 * File-resolver companion to listeningHub.ts — see
 * businessIndustries.files.ts for why this is split out. Only
 * app/content/[library]/[slug]/route.ts should import this file.
 */
export async function getListeningHubFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, [getListeningHubItem()], slug);
}
