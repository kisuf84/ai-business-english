export type LevelTestItem = {
  id: string;
  slug: string;
  title: string;
  sourceFile: string;
};

const ITEM: LevelTestItem = {
  id: "english-placement-test",
  slug: "english-placement-test",
  title: "English Placement Test",
  sourceFile: "english-placement-test.html",
};

const ITEMS: LevelTestItem[] = [ITEM];

/**
 * Exact client-provided copy, verbatim from "TAGLINES.pdf" (delivered
 * 2026-08-20 with the final Aug 19 icon package). Do not rewrite.
 */
export const LEVEL_TEST_HEADLINE = "Discover Your Level. Define Your Path.";

export const LEVEL_TEST_DESCRIPTION =
  "Find out where your English stands with a 30-minute Level Test covering both General and Business English. With 50 carefully designed questions spanning A1 to C1 on the CEFR scale, the test evaluates your overall English ability and helps identify the level that best matches your current skills.";

export const LEVEL_TEST_CLOSING =
  "Test your level. Know your strengths. Start learning at the right level.";

export function getLevelTestItem(): LevelTestItem {
  return ITEM;
}
