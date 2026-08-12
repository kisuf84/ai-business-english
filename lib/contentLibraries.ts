import { promises as fs } from "fs";
import path from "path";

/**
 * Shared plumbing for the August content expansion (Situational English,
 * Listening Training, Reading Training, Bilingual Compendium, Lexipro,
 * Lexica, Biz Compendium, Gossip English). English Training's own content
 * route/lib module is untouched and does not use this file.
 */
export type ContentLibraryId =
  | "situational-english"
  | "listening-training"
  | "reading-training"
  | "bilingual-compendium"
  | "lexipro"
  | "lexica"
  | "biz-compendium"
  | "gossip-english";

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
