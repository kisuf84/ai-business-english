import { resolveCuratedFilePath } from "./contentLibraries";
import { listBilingualCompendiumItems } from "./bilingualCompendium";

const LIBRARY = "bilingual-compendium" as const;

/**
 * File-resolver companion to bilingualCompendium.ts — see
 * businessIndustries.files.ts for why this is split out. Only
 * app/content/[library]/[slug]/route.ts should import this file.
 */
export async function getBilingualCompendiumFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, listBilingualCompendiumItems(), slug);
}
