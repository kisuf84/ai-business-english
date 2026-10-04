import { notFound } from "next/navigation";
import CorporateCategoryGrid from "../../../../../components/corporate/CorporateCategoryGrid";
import CatalogPageShell from "../../../../../components/shared/CatalogPageShell";
import {
  CORPORATE_FAMILY_COPY,
  LANGSLATE_CORPORATE_BASE_PATH,
  corporateCategoryHref,
  corporateCategoryThumbnailSrc,
  countCorporateLessons,
  getCorporateFamily,
} from "../../../../../lib/langslateCorporate";

export default function CorporateFamilyPage({ params }: { params: { family: string } }) {
  const family = getCorporateFamily(params.family);
  if (!family) notFound();
  const copy = CORPORATE_FAMILY_COPY[family.slug];

  return (
    <CatalogPageShell
      eyebrow="Langslate Corporate"
      title={family.label}
      description={`${copy.description} ${family.categories.length} ${copy.categoryNounPlural}, ${countCorporateLessons(family).toLocaleString("en-US")} ${copy.lessonNounPlural}.`}
      backLink={{ href: LANGSLATE_CORPORATE_BASE_PATH, label: "Langslate Corporate" }}
    >
      <CorporateCategoryGrid
        nounSingular={copy.categoryNoun}
        nounPlural={copy.categoryNounPlural}
        items={family.categories.map((category) => ({
          slug: category.slug,
          label: category.label,
          href: corporateCategoryHref(family.slug, category.slug),
          meta: `${category.lessons.length} ${category.lessons.length === 1 ? copy.lessonNoun : copy.lessonNounPlural}`,
          thumbnailSrc: corporateCategoryThumbnailSrc(family.slug, category.slug),
        }))}
      />
    </CatalogPageShell>
  );
}
