import ContentReaderPage from "../../../components/shared/ContentReaderPage";
import { getLexicaItem } from "../../../lib/lexica";

export default function LexicaPage() {
  const item = getLexicaItem();

  return (
    <ContentReaderPage
      eyebrow="Lexica"
      title={item.title}
      iframeSrc={`/content/lexica/${item.slug}`}
      backLinks={[{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
