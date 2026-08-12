import { resolveCuratedFilePath } from "./contentLibraries";

const LIBRARY = "bilingual-compendium" as const;
const THUMBNAIL_ROOT = "/bilingual-compendium-thumbnails";

export type BilingualCompendiumLanguage = "espanol" | "francais" | "portugues";

export type BilingualCompendiumItem = {
  id: string;
  slug: BilingualCompendiumLanguage;
  title: string;
  language: string;
  sourceFile: string;
  thumbnailUrl: string;
};

type Seed = Omit<BilingualCompendiumItem, "thumbnailUrl">;

const SEEDS: Seed[] = [
  { id: "espanol", slug: "espanol", title: "Español", language: "Español", sourceFile: "espanol.html" },
  { id: "francais", slug: "francais", title: "Français", language: "Français", sourceFile: "francais.html" },
  { id: "portugues", slug: "portugues", title: "Português", language: "Português", sourceFile: "portugues.html" },
];

const ITEMS: BilingualCompendiumItem[] = SEEDS.map((item) => ({
  ...item,
  thumbnailUrl: `${THUMBNAIL_ROOT}/${item.slug}.jpg`,
}));

export function listBilingualCompendiumItems(): BilingualCompendiumItem[] {
  return ITEMS;
}

export function getBilingualCompendiumItem(slug: string): BilingualCompendiumItem | null {
  return ITEMS.find((item) => item.slug === slug) ?? null;
}

export async function getBilingualCompendiumFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, ITEMS, slug);
}
