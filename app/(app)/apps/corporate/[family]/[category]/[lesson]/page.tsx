import { notFound } from "next/navigation";
import LessonContentUnavailable from "../../../../../../../components/corporate/LessonContentUnavailable";
import ContentReaderPage from "../../../../../../../components/shared/ContentReaderPage";
import { getLangslateContentUrl } from "../../../../../../../lib/langslateContent";
import {
  CORPORATE_FAMILY_COPY,
  corporateCategoryHref,
  corporateLessonHref,
  getCorporateLesson,
} from "../../../../../../../lib/langslateCorporate";

// The content origin is runtime configuration, so resolve it per request.
export const dynamic = "force-dynamic";

export default function CorporateLessonPage({
  params,
}: {
  params: { family: string; category: string; lesson: string };
}) {
  const found = getCorporateLesson(params.family, params.category, params.lesson);
  if (!found) notFound();
  const { family, category, lesson, next } = found;
  const copy = CORPORATE_FAMILY_COPY[family.slug];
  const lessonLabel = copy.lessonNoun.charAt(0).toUpperCase() + copy.lessonNoun.slice(1);
  const eyebrow = `${family.label} · ${category.label}${lesson.number !== null ? ` · ${lessonLabel} ${lesson.number}` : ""}`;
  const categoryLink = { href: corporateCategoryHref(family.slug, category.slug), label: category.label };

  const contentUrl = getLangslateContentUrl(lesson.contentKey);
  if (!contentUrl) {
    return <LessonContentUnavailable eyebrow={eyebrow} title={lesson.title} backLink={categoryLink} />;
  }

  return (
    <ContentReaderPage
      eyebrow={eyebrow}
      title={lesson.title}
      iframeSrc={contentUrl}
      primaryAction={
        next
          ? { href: corporateLessonHref(family.slug, category.slug, next.slug), label: `Next ${copy.lessonNoun}` }
          : undefined
      }
      backLinks={[categoryLink]}
    />
  );
}
