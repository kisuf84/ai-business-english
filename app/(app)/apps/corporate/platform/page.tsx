import type { Metadata } from "next";
import CorporatePlatform, { type CorporatePlatformFamily } from "../../../../../components/corporate/CorporatePlatform";
import { buildLangslateContentUrl, normalizeLangslateContentBaseUrl } from "../../../../../lib/langslateContent";
import {
  corporateCategoryHref,
  corporateCategoryThumbnailSrc,
  corporateFamilyHref,
  corporateLessonHref,
  countCorporateLessons,
  listCorporateFamilies,
} from "../../../../../lib/langslateCorporate";

const PROTOTYPE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;800;900&display=swap";
const FONT_AWESOME_HREF = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
const FAMILY_ORDER = ["professions", "industries", "departments", "pro"];

const totalLessons = listCorporateFamilies().reduce((sum, family) => sum + countCorporateLessons(family), 0);

export const metadata: Metadata = {
  title: "Langslate Corporate Platform",
  description: `${totalLessons.toLocaleString("en-US")} live professional English lessons across the Corporate platform.`,
};

export const dynamic = "force-dynamic";

export default function LangslateCorporatePlatformPage() {
  const contentBaseUrl = normalizeLangslateContentBaseUrl(process.env.LANGSLATE_CONTENT_BASE_URL);
  let lessonId = 0;
  const families: CorporatePlatformFamily[] = [...listCorporateFamilies()].sort(
    (a, b) => FAMILY_ORDER.indexOf(a.slug) - FAMILY_ORDER.indexOf(b.slug)
  ).map((family) => ({
    slug: family.slug,
    label: family.label,
    href: corporateFamilyHref(family.slug),
    categories: family.categories.map((category) => ({
      slug: category.slug,
      label: category.label,
      href: corporateCategoryHref(family.slug, category.slug),
      thumbnailSrc: corporateCategoryThumbnailSrc(family.slug, category.slug),
      lessons: category.lessons.map((lesson) => ({
        id: ++lessonId,
        slug: lesson.slug,
        title: lesson.title,
        number: lesson.number,
        href: corporateLessonHref(family.slug, category.slug, lesson.slug),
        contentUrl: buildLangslateContentUrl(lesson.contentKey, contentBaseUrl),
      })),
    })),
  }));

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={PROTOTYPE_FONTS_HREF} />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={FONT_AWESOME_HREF} />
      <CorporatePlatform families={families} />
    </>
  );
}
