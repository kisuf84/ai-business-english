import { resolveCuratedFilePath } from "./contentLibraries";

const LIBRARY = "gossip-english" as const;
const THUMBNAIL_ROOT = "/gossip-english-thumbnails";

export type GossipEnglishLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export const GOSSIP_ENGLISH_LEVEL_ORDER: GossipEnglishLevel[] = ["A1", "A2", "B1", "B2", "C1"];

/** Exact client-provided landing copy, verbatim from "Langslate latest
 * comments" (2026-08-17). Do not rewrite. */
export const GOSSIP_ENGLISH_HEADLINE =
  "Learn English Through Stories, Drama, Gossip & Real Internet Chaos";

export const GOSSIP_ENGLISH_DESCRIPTION =
  "Improve your English through stories, drama, gossip, controversies, and the wildest moments from the internet. 1,500 engaging stories designed to be both read and listened to aloud. Each story includes 6 key vocabulary, 5 auto-graded comprehension questions, and a creative writing section where you can share your own story and receive personalized AI feedback.";

export const GOSSIP_ENGLISH_CLOSING =
  "Read. Listen. Understand. Write. Gossip your way to better English!";

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
/**
 * Card titles use client-requested first names instead of "Volume N"
 * (Brice, Aug 2026 comments). The mapping is by CEFR level + existing
 * sequence order (1st/2nd/3rd file within each level), not by volume
 * number. "Ashley" replaces "Issouf" per Brice's explicit approval.
 * id/slug/sourceFile/volume are unchanged — display label only.
 */
const SEEDS: Seed[] = [
  // A1
  { id: "gossip-a1-vol9", slug: "gossip-a1-vol9", title: "Ashley", level: "A1", volume: 9, sourceFile: "gossip-a1-vol9.html" },
  { id: "gossip-a1-vol10", slug: "gossip-a1-vol10", title: "Lorena", level: "A1", volume: 10, sourceFile: "gossip-a1-vol10.html" },
  { id: "gossip-a1-vol11", slug: "gossip-a1-vol11", title: "Brice", level: "A1", volume: 11, sourceFile: "gossip-a1-vol11.html" },
  // A2
  { id: "gossip-a2-vol1", slug: "gossip-a2-vol1", title: "Patricia", level: "A2", volume: 1, sourceFile: "gossip-a2-vol1.html" },
  { id: "gossip-a2-vol2", slug: "gossip-a2-vol2", title: "Karen", level: "A2", volume: 2, sourceFile: "gossip-a2-vol2.html" },
  { id: "gossip-a2-vol12", slug: "gossip-a2-vol12", title: "Ariani", level: "A2", volume: 12, sourceFile: "gossip-a2-vol12.html" },
  // B1
  { id: "gossip-b1-vol3", slug: "gossip-b1-vol3", title: "Saulo", level: "B1", volume: 3, sourceFile: "gossip-b1-vol3.html" },
  { id: "gossip-b1-vol4", slug: "gossip-b1-vol4", title: "Maria", level: "B1", volume: 4, sourceFile: "gossip-b1-vol4.html" },
  { id: "gossip-b1-vol13", slug: "gossip-b1-vol13", title: "Debora", level: "B1", volume: 13, sourceFile: "gossip-b1-vol13.html" },
  // B2
  { id: "gossip-b2-vol5", slug: "gossip-b2-vol5", title: "Mileydi", level: "B2", volume: 5, sourceFile: "gossip-b2-vol5.html" },
  { id: "gossip-b2-vol6", slug: "gossip-b2-vol6", title: "Mercedes", level: "B2", volume: 6, sourceFile: "gossip-b2-vol6.html" },
  { id: "gossip-b2-vol14", slug: "gossip-b2-vol14", title: "Ginna", level: "B2", volume: 14, sourceFile: "gossip-b2-vol14.html" },
  // C1
  { id: "gossip-c1-vol7", slug: "gossip-c1-vol7", title: "Camila", level: "C1", volume: 7, sourceFile: "gossip-c1-vol7.html" },
  { id: "gossip-c1-vol8", slug: "gossip-c1-vol8", title: "Valentina", level: "C1", volume: 8, sourceFile: "gossip-c1-vol8.html" },
  { id: "gossip-c1-vol15", slug: "gossip-c1-vol15", title: "Carmen", level: "C1", volume: 15, sourceFile: "gossip-c1-vol15.html" },
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
