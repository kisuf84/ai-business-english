import { notFound } from "next/navigation";
import ContentReaderPage from "../../../../components/shared/ContentReaderPage";
import { getReadingTrainingItem } from "../../../../lib/readingTraining";

export default async function ReadingTrainingLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getReadingTrainingItem(slug);
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
