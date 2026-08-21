export type ListeningHubItem = {
  id: string;
  slug: string;
  title: string;
  sourceFile: string;
};

const ITEM: ListeningHubItem = {
  id: "listening-hub",
  slug: "listening-hub",
  title: "Listening Hub",
  sourceFile: "listening-hub.html",
};

const ITEMS: ListeningHubItem[] = [ITEM];

/**
 * Exact client-provided copy, verbatim from "TAGLINES.pdf" (delivered
 * 2026-08-20 with the final Aug 19 icon package). Do not rewrite.
 */
export const LISTENING_HUB_HEADLINE = "Listen. Understand. Improve.";

export const LISTENING_HUB_DESCRIPTION =
  "Take your English listening skills to the next level with 500+ real-world listenings designed for social and professional communication. Each listening comes with a full transcript, 6 essential vocabulary items, and 4 auto-graded comprehension questions to help you listen actively, learn new words, and track your understanding.";

export const LISTENING_HUB_CLOSING =
  "Build confidence. Sharpen your listening. Master English—one listening at a time.";

export function getListeningHubItem(): ListeningHubItem {
  return ITEM;
}
