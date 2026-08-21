import { resolveCuratedFilePath } from "./contentLibraries";
import { listSituationalEnglishItems } from "./situationalEnglish";

const LIBRARY = "situational-english" as const;

/**
 * File-resolver companion to situationalEnglish.ts — see
 * businessIndustries.files.ts for why this is split out. Only
 * app/content/[library]/[slug]/route.ts should import this file.
 */
export async function getSituationalEnglishFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, listSituationalEnglishItems(), slug);
}
