import ContentCatalogSections from "../shared/ContentCatalogSections";
import type { EnglishTrainingCategory, EnglishTrainingLesson } from "../../lib/englishTraining";

export default function EnglishTrainingCategorySections({
  lessons,
  categories,
}: {
  lessons: EnglishTrainingLesson[];
  categories: EnglishTrainingCategory[];
}) {
  const groups = categories.map((category) => ({
    key: category,
    label: category,
    items: lessons
      .filter((lesson) => lesson.category === category)
      .map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        href: `/english-training/${lesson.slug}`,
        thumbnailUrl: lesson.thumbnailUrl,
        fallbackLabel: lesson.category,
        ctaLabel: "Start Training",
      })),
  }));

  return <ContentCatalogSections groups={groups} />;
}
