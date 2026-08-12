import { resolveCuratedFilePath } from "./contentLibraries";

const LIBRARY = "lexipro" as const;
const THUMBNAIL_ROOT = "/lexipro-thumbnails";

export type LexiproLanguage = "espanol" | "francais" | "portugues";

export type LexiproItem = {
  id: string;
  slug: LexiproLanguage;
  title: string;
  language: string;
  sourceFile: string;
  thumbnailUrl: string;
};

type Seed = Omit<LexiproItem, "thumbnailUrl">;

const SEEDS: Seed[] = [
  { id: "espanol", slug: "espanol", title: "Español", language: "Español", sourceFile: "espanol.html" },
  { id: "francais", slug: "francais", title: "Français", language: "Français", sourceFile: "francais.html" },
  { id: "portugues", slug: "portugues", title: "Português", language: "Português", sourceFile: "portugues.html" },
];

const ITEMS: LexiproItem[] = SEEDS.map((item) => ({
  ...item,
  thumbnailUrl: `${THUMBNAIL_ROOT}/${item.slug}.jpg`,
}));

export function listLexiproItems(): LexiproItem[] {
  return ITEMS;
}

export function getLexiproItem(slug: string): LexiproItem | null {
  return ITEMS.find((item) => item.slug === slug) ?? null;
}

export async function getLexiproFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, ITEMS, slug);
}
