import { resolveCuratedFilePath } from "./contentLibraries";

const LIBRARY = "level-test" as const;

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

export function getLevelTestItem(): LevelTestItem {
  return ITEM;
}

export async function getLevelTestFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, ITEMS, slug);
}
