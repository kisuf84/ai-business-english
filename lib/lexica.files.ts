import { resolveCuratedFilePath } from "./contentLibraries";
import { getLexicaItem } from "./lexica";

const LIBRARY = "lexica" as const;

/**
 * File-resolver companion to lexica.ts — see businessIndustries.files.ts
 * for why this is split out. Only app/content/[library]/[slug]/route.ts
 * should import this file.
 */
export async function getLexicaFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, [getLexicaItem()], slug);
}
