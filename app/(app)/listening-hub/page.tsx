import ContentReaderPage from "../../../components/shared/ContentReaderPage";
import { getListeningHubItem } from "../../../lib/listeningHub";

export default function ListeningHubPage() {
  const item = getListeningHubItem();

  return (
    <ContentReaderPage
      eyebrow="Listening Hub"
      title={item.title}
      iframeSrc={`/content/listening-hub/${item.slug}`}
      backLinks={[{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
