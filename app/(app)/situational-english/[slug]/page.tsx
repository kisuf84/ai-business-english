import { notFound } from "next/navigation";
import ContentReaderPage from "../../../../components/shared/ContentReaderPage";
import { getSituationalEnglishItem } from "../../../../lib/situationalEnglish";

export default function SituationalEnglishLessonPage({
  params,
}: {
  params: { slug: string };
}) {
  const item = getSituationalEnglishItem(params.slug);
  if (!item) {
    notFound();
  }

  return (
    <ContentReaderPage
      eyebrow="Situational English"
      title={item.title}
      iframeSrc={`/content/situational-english/${item.slug}`}
      backLinks={[{ href: "/situational-english", label: "All Situational English" }]}
    />
  );
}
