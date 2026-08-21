import { resolveCuratedFilePath } from "./contentLibraries";
import { listReadingTrainingItems } from "./readingTraining";

const LIBRARY = "reading-training" as const;

/**
 * File-resolver companion to readingTraining.ts — see
 * businessIndustries.files.ts for why this is split out. Only
 * app/content/[library]/[slug]/route.ts should import this file.
 */
export async function getReadingTrainingFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, listReadingTrainingItems(), slug);
}
