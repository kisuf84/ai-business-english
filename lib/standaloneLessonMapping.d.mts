export type CorporateRuntimeCatalog = {
  families: Array<{
    slug: string;
    categories: Array<{
      label: string;
      lessons: Array<{ slug: string; contentKey: string }>;
    }>;
  }>;
};

export type AcademyRuntimeCatalog = {
  levels: Array<{
    slug: string;
    lessons: Array<{ slug: string; contentKey: string }>;
  }>;
};

export function createCorporateLessonKeyMap(catalog: CorporateRuntimeCatalog): Record<string, string>;
export function createAcademyLessonKeyMap(catalog: AcademyRuntimeCatalog): Record<string, string>;
export function getCorporateLessonContentKey(lesson: Record<string, string>, keyMap: Record<string, string>): string | null;
export function getAcademyLessonContentKey(lesson: Record<string, string>, keyMap: Record<string, string>): string | null;
export function createLessonR2AdapterScript(
  product: "corporate" | "academy",
  urlMap: Record<string, { contentKey: string; url: string }>
): string;
