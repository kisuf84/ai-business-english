import { notFound } from "next/navigation";
import ContentReaderPage from "../../../../components/shared/ContentReaderPage";
import { getSituationalEnglishItem } from "../../../../lib/situationalEnglish";

export default async function SituationalEnglishLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getSituationalEnglishItem(slug);
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
