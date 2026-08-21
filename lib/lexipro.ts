export type LexiproLanguage = "espanol" | "francais" | "portugues";

export type LexiproItem = {
  id: string;
  slug: LexiproLanguage;
  title: string;
  language: string;
  sourceFile: string;
};

const ITEMS: LexiproItem[] = [
  { id: "espanol", slug: "espanol", title: "Español", language: "Español", sourceFile: "espanol.html" },
  { id: "francais", slug: "francais", title: "Français", language: "Français", sourceFile: "francais.html" },
  { id: "portugues", slug: "portugues", title: "Português", language: "Português", sourceFile: "portugues.html" },
];

export function listLexiproItems(): LexiproItem[] {
  return ITEMS;
}

export function getLexiproItem(slug: string): LexiproItem | null {
  return ITEMS.find((item) => item.slug === slug) ?? null;
}
