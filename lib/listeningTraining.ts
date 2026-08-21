const THUMBNAIL_ROOT = "/listening-training-thumbnails";

export type ListeningTrainingLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export type ListeningTrainingItem = {
  id: string;
  slug: string;
  title: string;
  level: ListeningTrainingLevel;
  sourceFile: string;
  thumbnailUrl: string;
};

type Seed = Omit<ListeningTrainingItem, "thumbnailUrl">;

/**
 * Curated from Aug 10 migration / bricelisteningtrainingrightfiles ONLY.
 * The superseded bricelisteningtraining set (unnamespaced "progress"
 * localStorage key, would collide across levels) is intentionally excluded.
 */
const SEEDS: Seed[] = [
  { id: "listening-a1", slug: "listening-a1", title: "A1 English Listening", level: "A1", sourceFile: "listening-a1.html" },
  { id: "listening-a2", slug: "listening-a2", title: "A2 English Listening", level: "A2", sourceFile: "listening-a2.html" },
  { id: "listening-b1", slug: "listening-b1", title: "B1 English Listening", level: "B1", sourceFile: "listening-b1.html" },
  { id: "listening-b2", slug: "listening-b2", title: "B2 English Listening", level: "B2", sourceFile: "listening-b2.html" },
  { id: "listening-c1", slug: "listening-c1", title: "C1 English Listening", level: "C1", sourceFile: "listening-c1.html" },
];

const ITEMS: ListeningTrainingItem[] = SEEDS.map((item) => ({
  ...item,
  thumbnailUrl: `${THUMBNAIL_ROOT}/${item.slug}.jpg`,
}));

export function listListeningTrainingItems(): ListeningTrainingItem[] {
  return ITEMS;
}

export function getListeningTrainingItem(slug: string): ListeningTrainingItem | null {
  return ITEMS.find((item) => item.slug === slug) ?? null;
}
