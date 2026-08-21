import { resolveCuratedFilePath } from "./contentLibraries";
import { listListeningTrainingItems } from "./listeningTraining";

const LIBRARY = "listening-training" as const;

/**
 * File-resolver companion to listeningTraining.ts — see
 * businessIndustries.files.ts for why this is split out. Only
 * app/content/[library]/[slug]/route.ts should import this file.
 */
export async function getListeningTrainingFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, listListeningTrainingItems(), slug);
}
