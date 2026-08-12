import { resolveCuratedFilePath } from "./contentLibraries";

const LIBRARY = "gossip-english" as const;
const THUMBNAIL_ROOT = "/gossip-english-thumbnails";

export type GossipEnglishLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export const GOSSIP_ENGLISH_LEVEL_ORDER: GossipEnglishLevel[] = ["A1", "A2", "B1", "B2", "C1"];

/** Exact client-provided landing copy — do not rewrite beyond the approved
 * per-level file count (now 3, updated 2026-08-12 to match the final 15-file
 * Gossip English set). */
export const GOSSIP_ENGLISH_DESCRIPTION =
  "Learn English through stories, drama, Gossips & Real internet chaos. Each level has three (3) files.";

export type GossipEnglishItem = {
  id: string;
  slug: string;
  title: string;
  level: GossipEnglishLevel;
  volume: number;
  sourceFile: string;
  thumbnailUrl: string;
};

type Seed = Omit<GossipEnglishItem, "thumbnailUrl">;

/**
 * Curated from Aug 10 migration / bricegossipenglishrightfiles (Vol. I–X)
 * plus Aug 11 migration (Vol. XI–XV). Volume numbers verified from each
 * source file's own <title> tag; gossip-c1-vol7 was sourced from a
 * misnamed "BE C1 (1).html" (BE instead of GE) but its title confirmed
 * it is genuinely Gossip English Vol. VII.
 */
const SEEDS: Seed[] = [
  // A1
  { id: "gossip-a1-vol9", slug: "gossip-a1-vol9", title: "Volume 9", level: "A1", volume: 9, sourceFile: "gossip-a1-vol9.html" },
  { id: "gossip-a1-vol10", slug: "gossip-a1-vol10", title: "Volume 10", level: "A1", volume: 10, sourceFile: "gossip-a1-vol10.html" },
  { id: "gossip-a1-vol11", slug: "gossip-a1-vol11", title: "Volume 11", level: "A1", volume: 11, sourceFile: "gossip-a1-vol11.html" },
  // A2
  { id: "gossip-a2-vol1", slug: "gossip-a2-vol1", title: "Volume 1", level: "A2", volume: 1, sourceFile: "gossip-a2-vol1.html" },
  { id: "gossip-a2-vol2", slug: "gossip-a2-vol2", title: "Volume 2", level: "A2", volume: 2, sourceFile: "gossip-a2-vol2.html" },
  { id: "gossip-a2-vol12", slug: "gossip-a2-vol12", title: "Volume 12", level: "A2", volume: 12, sourceFile: "gossip-a2-vol12.html" },
  // B1
  { id: "gossip-b1-vol3", slug: "gossip-b1-vol3", title: "Volume 3", level: "B1", volume: 3, sourceFile: "gossip-b1-vol3.html" },
  { id: "gossip-b1-vol4", slug: "gossip-b1-vol4", title: "Volume 4", level: "B1", volume: 4, sourceFile: "gossip-b1-vol4.html" },
  { id: "gossip-b1-vol13", slug: "gossip-b1-vol13", title: "Volume 13", level: "B1", volume: 13, sourceFile: "gossip-b1-vol13.html" },
  // B2
  { id: "gossip-b2-vol5", slug: "gossip-b2-vol5", title: "Volume 5", level: "B2", volume: 5, sourceFile: "gossip-b2-vol5.html" },
  { id: "gossip-b2-vol6", slug: "gossip-b2-vol6", title: "Volume 6", level: "B2", volume: 6, sourceFile: "gossip-b2-vol6.html" },
  { id: "gossip-b2-vol14", slug: "gossip-b2-vol14", title: "Volume 14", level: "B2", volume: 14, sourceFile: "gossip-b2-vol14.html" },
  // C1
  { id: "gossip-c1-vol7", slug: "gossip-c1-vol7", title: "Volume 7", level: "C1", volume: 7, sourceFile: "gossip-c1-vol7.html" },
  { id: "gossip-c1-vol8", slug: "gossip-c1-vol8", title: "Volume 8", level: "C1", volume: 8, sourceFile: "gossip-c1-vol8.html" },
  { id: "gossip-c1-vol15", slug: "gossip-c1-vol15", title: "Volume 15", level: "C1", volume: 15, sourceFile: "gossip-c1-vol15.html" },
];

const ITEMS: GossipEnglishItem[] = SEEDS.map((item) => ({
  ...item,
  thumbnailUrl: `${THUMBNAIL_ROOT}/${item.slug}.jpg`,
}));

export function listGossipEnglishItems(): GossipEnglishItem[] {
  return ITEMS;
}

export function getGossipEnglishItem(slug: string): GossipEnglishItem | null {
  return ITEMS.find((item) => item.slug === slug) ?? null;
}

export async function getGossipEnglishFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, ITEMS, slug);
}
