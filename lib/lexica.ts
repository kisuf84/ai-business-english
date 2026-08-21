export type LexicaItem = {
  id: string;
  slug: string;
  title: string;
  sourceFile: string;
};

const ITEM: LexicaItem = {
  id: "vocabulary-bank",
  slug: "vocabulary-bank",
  title: "Lexica",
  sourceFile: "vocabulary-bank.html",
};

const ITEMS: LexicaItem[] = [ITEM];

export function getLexicaItem(): LexicaItem {
  return ITEM;
}
