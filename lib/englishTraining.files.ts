import { promises as fs } from "fs";
import path from "path";
import { getEnglishTrainingLesson } from "./englishTraining";

const ENGLISH_TRAINING_CONTENT_ROOT = path.join(
  process.cwd(),
  "english-training-content",
  "lessons"
);

/**
 * File-resolver companion to englishTraining.ts, split out so that
 * app/api/search/route.ts (which only needs the pure metadata in
 * englishTraining.ts) never transitively imports `fs`/`path` or anything
 * that touches english-training-content/lessons — see
 * lib/businessIndustries.files.ts for the full rationale (same pattern).
 * Only app/english-training-content/[lesson]/route.ts should import this
 * file.
 *
 * Resolves a lesson slug to its content file path on disk. Only slugs
 * present in the curated LESSONS table (englishTraining.ts) are ever
 * looked up, so this cannot be used to traverse to an arbitrary
 * filesystem path.
 */
export async function getEnglishTrainingLessonFilePath(slug: string) {
  const lesson = getEnglishTrainingLesson(slug);
  if (!lesson) return null;

  const filePath = path.join(ENGLISH_TRAINING_CONTENT_ROOT, `${lesson.slug}.html`);

  try {
    await fs.access(filePath);
  } catch {
    return null;
  }

  return { lesson, filePath };
}
