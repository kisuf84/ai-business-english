import { resolveCuratedFilePath } from "./contentLibraries";

const LIBRARY = "listening-hub" as const;

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

export function getListeningHubItem(): ListeningHubItem {
  return ITEM;
}

export async function getListeningHubFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, ITEMS, slug);
}
