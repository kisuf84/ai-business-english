import type { Metadata } from "next";
import CorporateLanding, { type CorporateLandingTab } from "../../../../../components/corporate/CorporateLanding";
import {
  corporateCategoryThumbnailSrc,
  corporateCategoryHref,
  corporateFamilyHref,
  countCorporateLessons,
  getCorporateFamily,
  listCorporateFamilies,
  type CorporateFamily,
  type CorporateFamilySlug,
} from "../../../../../lib/langslateCorporate";

const PROTOTYPE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap";
const TAB_ORDER: CorporateFamilySlug[] = ["professions", "industries", "departments", "pro"];
const PREVIEW_CARD_COUNT = 8;
const families = listCorporateFamilies();
const totalLessons = families.reduce((sum, family) => sum + countCorporateLessons(family), 0);
const totalLessonsRounded = Math.floor(totalLessons / 100) * 100;

export const metadata: Metadata = {
  title: "Langslate Corporate Platform",
  description: `${totalLessons.toLocaleString("en-US")} live professional English lessons across four corporate libraries.`,
};

export default function LangslateCorporatePlatformPage() {
  const tabs: CorporateLandingTab[] = TAB_ORDER.map((slug) => getCorporateFamily(slug))
    .filter((family): family is CorporateFamily => family !== null)
    .map((family) => ({
      key: family.slug,
      label: family.label,
      categoryCount: family.categories.length,
      href: corporateFamilyHref(family.slug),
      cards: family.categories.slice(0, PREVIEW_CARD_COUNT).map((category) => ({
        slug: category.slug,
        name: category.label.toUpperCase(),
        count: category.lessons.length,
        href: corporateCategoryHref(family.slug, category.slug),
        thumbnailSrc: corporateCategoryThumbnailSrc(family.slug, category.slug),
      })),
    }));

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={PROTOTYPE_FONTS_HREF} />
      <CorporateLanding
        totalLessons={totalLessons}
        totalLessonsRounded={totalLessonsRounded}
        totalCategories={families.reduce((sum, family) => sum + family.categories.length, 0)}
        professionCount={getCorporateFamily("professions")?.categories.length ?? 0}
        tabs={tabs}
      />
    </>
  );
}
