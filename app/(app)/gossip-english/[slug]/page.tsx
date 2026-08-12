import { notFound } from "next/navigation";
import ContentReaderPage from "../../../../components/shared/ContentReaderPage";
import { getGossipEnglishItem } from "../../../../lib/gossipEnglish";

export default function GossipEnglishLessonPage({
  params,
}: {
  params: { slug: string };
}) {
  const item = getGossipEnglishItem(params.slug);
  if (!item) {
    notFound();
  }

  return (
    <ContentReaderPage
      eyebrow="Gossip English"
      title={`${item.level} · ${item.title}`}
      iframeSrc={`/content/gossip-english/${item.slug}`}
      backLinks={[{ href: "/gossip-english", label: "All Gossip English" }]}
    />
  );
}
