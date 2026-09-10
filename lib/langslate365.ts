export type Langslate365Item = {
  id: string;
  slug: string;
  title: string;
  sourceFile: string;
};

const LANDING: Langslate365Item = {
  id: "landing",
  slug: "landing",
  title: "Langslate 365",
  sourceFile: "landing.html",
};

const COURSE: Langslate365Item = {
  id: "course",
  slug: "course",
  title: "5-Minute Business English Mastery",
  sourceFile: "course.html",
};

const ITEMS: Langslate365Item[] = [LANDING, COURSE];

export function listLangslate365Items(): Langslate365Item[] {
  return ITEMS;
}

export function getLangslate365LandingItem(): Langslate365Item {
  return LANDING;
}

export function getLangslate365CourseItem(): Langslate365Item {
  return COURSE;
}
