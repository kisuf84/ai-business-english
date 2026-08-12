import { notFound } from "next/navigation";
import ContentReaderPage from "../../../../components/shared/ContentReaderPage";
import { getReadingTrainingItem } from "../../../../lib/readingTraining";

export default function ReadingTrainingLessonPage({
  params,
}: {
  params: { slug: string };
}) {
  const item = getReadingTrainingItem(params.slug);
  if (!item) {
    notFound();
  }

  return (
    <ContentReaderPage
      eyebrow="Reading Training"
      title={item.title}
      iframeSrc={`/content/reading-training/${item.slug}`}
      backLinks={[{ href: "/reading-training", label: "All Reading Training" }]}
    />
  );
}
