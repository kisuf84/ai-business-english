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
