import { notFound } from "next/navigation";
import CorporateLessonList from "../../../../../../components/corporate/CorporateLessonList";
import CatalogPageShell from "../../../../../../components/shared/CatalogPageShell";
import {
  CORPORATE_FAMILY_COPY,
  corporateFamilyHref,
  corporateLessonHref,
  getCorporateCategory,
} from "../../../../../../lib/langslateCorporate";

export default function CorporateCategoryPage({
  params,
}: {
  params: { family: string; category: string };
}) {
  const found = getCorporateCategory(params.family, params.category);
  if (!found) notFound();
  const { family, category } = found;
  const copy = CORPORATE_FAMILY_COPY[family.slug];

  return (
    <CatalogPageShell
      eyebrow={`Langslate Corporate · ${family.label}`}
      title={category.label}
      description={`${category.lessons.length} ${category.lessons.length === 1 ? copy.lessonNoun : copy.lessonNounPlural}`}
      backLink={{ href: corporateFamilyHref(family.slug), label: family.label }}
    >
      <CorporateLessonList
        lessonNoun={copy.lessonNoun}
        items={category.lessons.map((lesson) => ({
          slug: lesson.slug,
          title: lesson.title,
          number: lesson.number,
          href: corporateLessonHref(family.slug, category.slug, lesson.slug),
        }))}
      />
    </CatalogPageShell>
  );
}
