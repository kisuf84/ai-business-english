import { resolveCuratedFilePath } from "./contentLibraries";

const LIBRARY = "biz-compendium" as const;

export type BizCompendiumItem = {
  id: string;
  slug: string;
  title: string;
  sourceFile: string;
};

const ITEM: BizCompendiumItem = {
  id: "vocabulary-mastery",
  slug: "vocabulary-mastery",
  title: "Biz Compendium",
  sourceFile: "vocabulary-mastery.html",
};

const ITEMS: BizCompendiumItem[] = [ITEM];

export function getBizCompendiumItem(): BizCompendiumItem {
  return ITEM;
}

export async function getBizCompendiumFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, ITEMS, slug);
}
