import { resolveCuratedFilePath } from "./contentLibraries";
import { getBizCompendiumItem } from "./bizCompendium";

const LIBRARY = "biz-compendium" as const;

/**
 * File-resolver companion to bizCompendium.ts — see
 * businessIndustries.files.ts for why this is split out. Only
 * app/content/[library]/[slug]/route.ts should import this file.
 */
export async function getBizCompendiumFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, [getBizCompendiumItem()], slug);
}
