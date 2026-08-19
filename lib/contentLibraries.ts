import { promises as fs } from "fs";
import path from "path";

/**
 * Shared plumbing for the August content expansion (Situational English,
 * Listening Training, Reading Training, Bilingual Compendium, Lexipro,
 * Lexica, Biz Compendium, Gossip English) plus the Aug 19 batch (Business
 * Industries, Syntax Flow, Level Test, Listening Hub, Speaking Topics).
 * English Training's own content route/lib module is untouched and does
 * not use this file.
 *
 * Aug 19 IA (audited 108 files + 1 late addition = 109, no code-model type
 * change needed beyond this union — same curated-item/resolveCuratedFilePath
 * shape as every other library here):
 * - "business-industries": one flat catalog, 61 items, no sub-grouping
 *   (source has no category metadata beyond the industry name itself).
 * - "syntax-flow-espanol" / "-francais" / "-portugues": three separate
 *   libraries (not one shared "syntax-flow" id) so each language's 15
 *   A1-C1 items (3 volumes/level) can have simple globally-unique slugs
 *   scoped by language, exactly like Bilingual Compendium/Lexipro's
 *   per-language nav children, but each language is itself a small
 *   level-grouped catalog (same shape as Gossip English) rather than a
 *   single document.
 * - "level-test" / "listening-hub" / "speaking-topics": three standalone
 *   single-item libraries, same shape as Lexica/Biz Compendium (direct
 *   reader, no catalog page). Speaking Topics was a late single-file
 *   addition (not an industry, not leveled, not listening-focused) — given
 *   its own top-level nav entry rather than folded into an existing Aug 19
 *   bucket it didn't actually fit.
 */
export type ContentLibraryId =
  | "situational-english"
  | "listening-training"
  | "reading-training"
  | "bilingual-compendium"
  | "lexipro"
  | "lexica"
  | "biz-compendium"
  | "gossip-english"
  | "business-industries"
  | "syntax-flow-espanol"
  | "syntax-flow-francais"
  | "syntax-flow-portugues"
  | "level-test"
  | "listening-hub"
  | "speaking-topics";

const CONTENT_LIBRARY_ROOT = path.join(process.cwd(), "content-library");

export function getContentLibraryDir(library: ContentLibraryId): string {
  return path.join(CONTENT_LIBRARY_ROOT, library);
}

/**
 * Resolves a slug to its file path ONLY if it matches a curated item in
 * `items`, and the file actually exists on disk. `slug` may come straight
 * from a URL param — it is never joined into a filesystem path directly,
 * only used to look up an already-known, pre-curated `sourceFile`.
 */
export async function resolveCuratedFilePath(
  library: ContentLibraryId,
  items: { slug: string; sourceFile: string }[],
  slug: string
): Promise<string | null> {
  const item = items.find((entry) => entry.slug === slug);
  if (!item) return null;

  const filePath = path.join(getContentLibraryDir(library), item.sourceFile);

  try {
    await fs.access(filePath);
  } catch {
    return null;
  }

  return filePath;
}
