import { resolveCuratedFilePath } from "./contentLibraries";
import { listLangslate365Items } from "./langslate365";

const LIBRARY = "langslate-365" as const;

/**
 * File-resolver companion to langslate365.ts — see businessIndustries.files.ts
 * for why this is split out. Only app/content/[library]/[slug]/route.ts
 * should import this file.
 */
export async function getLangslate365FilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, listLangslate365Items(), slug);
}
