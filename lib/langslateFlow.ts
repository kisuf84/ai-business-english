export type LangslateFlowItem = {
  id: string;
  slug: string;
  title: string;
  sourceFile: string;
};

const LANDING: LangslateFlowItem = {
  id: "landing",
  slug: "landing",
  title: "Langslate Flow",
  sourceFile: "landing.html",
};

const APP: LangslateFlowItem = {
  id: "app",
  slug: "app",
  title: "Langslate Flow — AI Voice Tutor",
  sourceFile: "app.html",
};

const ITEMS: LangslateFlowItem[] = [LANDING, APP];

export function listLangslateFlowItems(): LangslateFlowItem[] {
  return ITEMS;
}

export function getLangslateFlowLandingItem(): LangslateFlowItem {
  return LANDING;
}

export function getLangslateFlowAppItem(): LangslateFlowItem {
  return APP;
}
