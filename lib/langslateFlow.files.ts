import { resolveCuratedFilePath } from "./contentLibraries";
import { listLangslateFlowItems } from "./langslateFlow";

const LIBRARY = "langslate-flow" as const;

/**
 * File-resolver companion to langslateFlow.ts — see businessIndustries.files.ts
 * for why this is split out. Only app/content/[library]/[slug]/route.ts
 * should import this file.
 */
export async function getLangslateFlowFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, listLangslateFlowItems(), slug);
}
