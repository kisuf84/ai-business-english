export type SyntaxFlowLanguage = "espanol" | "francais" | "portugues";

/**
 * Display labels are the English language names ("Spanish"/"French"/
 * "Portuguese") per Brice's Aug 19 IA clarification — the `slug` values
 * (espanol/francais/portugues) are unchanged internal route/content-library
 * identifiers, kept stable rather than renamed along with the display copy.
 */
export const SYNTAX_FLOW_LANGUAGES: { slug: SyntaxFlowLanguage; label: string; flag: string }[] = [
  { slug: "espanol", label: "Spanish", flag: "🇪🇸" },
  { slug: "francais", label: "French", flag: "🇫🇷" },
  { slug: "portugues", label: "Portuguese", flag: "🇧🇷" },
];

/**
 * Exact client-provided copy, verbatim from "TAGLINES.pdf" (delivered
 * 2026-08-20 with the final Aug 19 icon package). Do not rewrite. Same
 * generic copy across all three language catalog pages — the PDF text
 * itself describes all three languages together, not per-language.
 */
export const SYNTAX_FLOW_HEADLINE = "Think in English. Build the Sentence. Master the Structure.";

export const SYNTAX_FLOW_DESCRIPTION =
  "Turn English grammar into a game with SyntaxFlow, an interactive word-order challenge designed for Spanish, French, and Portuguese speakers. Rebuild English sentences from their source-language equivalents, strengthen your understanding of English sentence structure, and learn with a Grammar Tip included in every exercise.";

export const SYNTAX_FLOW_DESCRIPTION_2 =
  "With 4,500 exercises—1,500 for Spanish speakers, 1,500 for French speakers, and 1,500 for Portuguese speakers—SyntaxFlow helps you move beyond translation and start thinking naturally in English.";

export const SYNTAX_FLOW_CLOSING = "Reorder. Understand. Master English sentence structure.";

export type SyntaxFlowLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export const SYNTAX_FLOW_LEVEL_ORDER: SyntaxFlowLevel[] = ["A1", "A2", "B1", "B2", "C1"];

export type SyntaxFlowItem = {
  id: string;
  slug: string;
  title: string;
  level: SyntaxFlowLevel;
  volume: number;
  sourceFile: string;
  thumbnailUrl: string;
};

type Seed = Omit<SyntaxFlowItem, "thumbnailUrl">;

const THUMBNAIL_ROOT_BY_LANGUAGE: Record<SyntaxFlowLanguage, string> = {
  espanol: "/syntax-flow-thumbnails/espanol",
  francais: "/syntax-flow-thumbnails/francais",
  portugues: "/syntax-flow-thumbnails/portugues",
};

/**
 * Curated from Aug 19 migration (brice_syntaxflow{spanish,french,portuguese}english).
 * Each language has the same 5-level x 3-volume shape (15 files), so one
 * seed list drives all three — sourceFile/slug are identical per language
 * (a1-vol1.html … c1-vol3.html) since each language lives in its own
 * content-library/syntax-flow-<language>/ folder (see contentLibraries.ts).
 * Titles are "Volume N" (the source files carry no per-volume codename,
 * unlike Reading Training/Situational English).
 */
const LEVEL_SEEDS: { level: SyntaxFlowLevel; volume: number }[] = SYNTAX_FLOW_LEVEL_ORDER.flatMap((level) =>
  [1, 2, 3].map((volume) => ({ level, volume }))
);

function buildSeeds(): Seed[] {
  return LEVEL_SEEDS.map(({ level, volume }) => {
    const slug = `${level.toLowerCase()}-vol${volume}`;
    return {
      id: slug,
      slug,
      title: `Volume ${volume}`,
      level,
      volume,
      sourceFile: `${slug}.html`,
    };
  });
}

const SEEDS = buildSeeds();

const ITEMS_BY_LANGUAGE: Record<SyntaxFlowLanguage, SyntaxFlowItem[]> = {
  espanol: SEEDS.map((item) => ({ ...item, thumbnailUrl: `${THUMBNAIL_ROOT_BY_LANGUAGE.espanol}/${item.slug}.jpg` })),
  francais: SEEDS.map((item) => ({ ...item, thumbnailUrl: `${THUMBNAIL_ROOT_BY_LANGUAGE.francais}/${item.slug}.jpg` })),
  portugues: SEEDS.map((item) => ({ ...item, thumbnailUrl: `${THUMBNAIL_ROOT_BY_LANGUAGE.portugues}/${item.slug}.jpg` })),
};

export function isSyntaxFlowLanguage(value: string): value is SyntaxFlowLanguage {
  return value === "espanol" || value === "francais" || value === "portugues";
}

export function listSyntaxFlowItems(language: SyntaxFlowLanguage): SyntaxFlowItem[] {
  return ITEMS_BY_LANGUAGE[language];
}

export function getSyntaxFlowItem(language: SyntaxFlowLanguage, slug: string): SyntaxFlowItem | null {
  return ITEMS_BY_LANGUAGE[language].find((item) => item.slug === slug) ?? null;
}
