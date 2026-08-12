import { resolveCuratedFilePath } from "./contentLibraries";

const LIBRARY = "lexica" as const;

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

export async function getLexicaFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, ITEMS, slug);
}
