import ContentReaderPage from "../../../components/shared/ContentReaderPage";
import {
  getSpeakingTopicsItem,
  SPEAKING_TOPICS_HEADLINE,
  SPEAKING_TOPICS_DESCRIPTION,
  SPEAKING_TOPICS_CLOSING,
} from "../../../lib/speakingTopics";

export default function SpeakingTopicsPage() {
  const item = getSpeakingTopicsItem();

  return (
    <ContentReaderPage
      eyebrow="Speaking Topics"
      title={item.title}
      description={
        <>
          <strong className="text-[var(--ink)]">{SPEAKING_TOPICS_HEADLINE}</strong>
          <br />
          {SPEAKING_TOPICS_DESCRIPTION}
          <br />
          <strong className="text-[var(--ink)]">{SPEAKING_TOPICS_CLOSING}</strong>
        </>
      }
      iframeSrc={`/content/speaking-topics/${item.slug}`}
      backLinks={[{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
