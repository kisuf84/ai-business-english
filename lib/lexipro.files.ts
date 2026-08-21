import { resolveCuratedFilePath } from "./contentLibraries";
import { listLexiproItems } from "./lexipro";

const LIBRARY = "lexipro" as const;

/**
 * File-resolver companion to lexipro.ts — see businessIndustries.files.ts
 * for why this is split out. Only app/content/[library]/[slug]/route.ts
 * should import this file.
 */
export async function getLexiproFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, listLexiproItems(), slug);
}
