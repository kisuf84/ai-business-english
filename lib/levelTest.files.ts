import { resolveCuratedFilePath } from "./contentLibraries";
import { getLevelTestItem } from "./levelTest";

const LIBRARY = "level-test" as const;

/**
 * File-resolver companion to levelTest.ts — see businessIndustries.files.ts
 * for why this is split out. Only app/content/[library]/[slug]/route.ts
 * should import this file.
 */
export async function getLevelTestFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, [getLevelTestItem()], slug);
}
