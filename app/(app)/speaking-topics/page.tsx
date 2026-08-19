import ContentReaderPage from "../../../components/shared/ContentReaderPage";
import { getSpeakingTopicsItem } from "../../../lib/speakingTopics";

export default function SpeakingTopicsPage() {
  const item = getSpeakingTopicsItem();

  return (
    <ContentReaderPage
      eyebrow="Speaking Topics"
      title={item.title}
      iframeSrc={`/content/speaking-topics/${item.slug}`}
      backLinks={[{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
