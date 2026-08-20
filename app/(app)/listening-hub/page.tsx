import ContentReaderPage from "../../../components/shared/ContentReaderPage";
import {
  getListeningHubItem,
  LISTENING_HUB_HEADLINE,
  LISTENING_HUB_DESCRIPTION,
  LISTENING_HUB_CLOSING,
} from "../../../lib/listeningHub";

export default function ListeningHubPage() {
  const item = getListeningHubItem();

  return (
    <ContentReaderPage
      eyebrow="Listening Hub"
      title={item.title}
      description={
        <>
          <strong className="text-[var(--ink)]">{LISTENING_HUB_HEADLINE}</strong>
          <br />
          {LISTENING_HUB_DESCRIPTION}
          <br />
          <strong className="text-[var(--ink)]">{LISTENING_HUB_CLOSING}</strong>
        </>
      }
      iframeSrc={`/content/listening-hub/${item.slug}`}
      backLinks={[{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
