import { notFound } from "next/navigation";
import ContentReaderPage from "../../../../components/shared/ContentReaderPage";
import { getListeningTrainingItem } from "../../../../lib/listeningTraining";

export default function ListeningTrainingLessonPage({
  params,
}: {
  params: { slug: string };
}) {
  const item = getListeningTrainingItem(params.slug);
  if (!item) {
    notFound();
  }

  return (
    <ContentReaderPage
      eyebrow="Listening Training"
      title={item.title}
      iframeSrc={`/content/listening-training/${item.slug}`}
      backLinks={[{ href: "/listening-training", label: "All Listening Training" }]}
    />
  );
}
