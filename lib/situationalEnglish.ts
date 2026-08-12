import { resolveCuratedFilePath } from "./contentLibraries";

const LIBRARY = "situational-english" as const;
const THUMBNAIL_ROOT = "/situational-english-thumbnails";

export type SituationalEnglishItem = {
  id: string;
  slug: string;
  title: string;
  sourceFile: string;
  thumbnailUrl: string;
};

type Seed = Omit<SituationalEnglishItem, "thumbnailUrl">;

/** Curated from Aug 10 migration / bricesituationalenglish. Titles use each
 * file's internal codename — descriptive titles alone would be generic. */
const SEEDS: Seed[] = [
  { id: "situ", slug: "situ", title: "Situ", sourceFile: "situ.html" },
  { id: "everyday", slug: "everyday", title: "Everyday", sourceFile: "everyday.html" },
  { id: "voyage", slug: "voyage", title: "Voyage", sourceFile: "voyage.html" },
  { id: "savvy", slug: "savvy", title: "Savvy", sourceFile: "savvy.html" },
  { id: "friendly", slug: "friendly", title: "Friendly", sourceFile: "friendly.html" },
];

const ITEMS: SituationalEnglishItem[] = SEEDS.map((item) => ({
  ...item,
  thumbnailUrl: `${THUMBNAIL_ROOT}/${item.slug}.jpg`,
}));

export function listSituationalEnglishItems(): SituationalEnglishItem[] {
  return ITEMS;
}

export function getSituationalEnglishItem(slug: string): SituationalEnglishItem | null {
  return ITEMS.find((item) => item.slug === slug) ?? null;
}

export async function getSituationalEnglishFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, ITEMS, slug);
}
