import ContentReaderPage from "../../../components/shared/ContentReaderPage";
import { getLexicaItem } from "../../../lib/lexica";

export default function LexicaPage() {
  const item = getLexicaItem();

  return (
    <ContentReaderPage
      eyebrow="Lexica"
      title={item.title}
      description="Explore more than 1,000 Business English terms by Industries, Departments and Professions with real-world context examples, all voiced aloud."
      iframeSrc={`/content/lexica/${item.slug}`}
      backLinks={[{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
