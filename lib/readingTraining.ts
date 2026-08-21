const THUMBNAIL_ROOT = "/reading-training-thumbnails";

export type ReadingTrainingLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export const READING_TRAINING_LEVEL_ORDER: ReadingTrainingLevel[] = ["A1", "A2", "B1", "B2", "C1"];

export type ReadingTrainingItem = {
  id: string;
  slug: string;
  title: string;
  level: ReadingTrainingLevel;
  sourceFile: string;
  thumbnailUrl: string;
};

type Seed = Omit<ReadingTrainingItem, "thumbnailUrl">;

/** Curated from Aug 11 migration. Titles use each file's internal codename —
 * exactly 2 per level, matching the client's stated structure. */
const SEEDS: Seed[] = [
  { id: "reading-folio", slug: "reading-folio", title: "Folio", level: "A1", sourceFile: "reading-folio.html" },
  { id: "reading-primer", slug: "reading-primer", title: "Primer", level: "A1", sourceFile: "reading-primer.html" },
  { id: "reading-chapter", slug: "reading-chapter", title: "Chapter", level: "A2", sourceFile: "reading-chapter.html" },
  { id: "reading-atlas", slug: "reading-atlas", title: "Atlas", level: "A2", sourceFile: "reading-atlas.html" },
  { id: "reading-threshold", slug: "reading-threshold", title: "Threshold", level: "B1", sourceFile: "reading-threshold.html" },
  { id: "reading-vantage", slug: "reading-vantage", title: "Vantage", level: "B1", sourceFile: "reading-vantage.html" },
  { id: "reading-zenith", slug: "reading-zenith", title: "Zenith", level: "B2", sourceFile: "reading-zenith.html" },
  { id: "reading-spectrum", slug: "reading-spectrum", title: "Spectrum", level: "B2", sourceFile: "reading-spectrum.html" },
  { id: "reading-diana", slug: "reading-diana", title: "Diana", level: "C1", sourceFile: "reading-diana.html" },
  { id: "reading-echelon", slug: "reading-echelon", title: "Echelon", level: "C1", sourceFile: "reading-echelon.html" },
];

const ITEMS: ReadingTrainingItem[] = SEEDS.map((item) => ({
  ...item,
  thumbnailUrl: `${THUMBNAIL_ROOT}/${item.slug}.jpg`,
}));

export function listReadingTrainingItems(): ReadingTrainingItem[] {
  return ITEMS;
}

export function getReadingTrainingItem(slug: string): ReadingTrainingItem | null {
  return ITEMS.find((item) => item.slug === slug) ?? null;
}
