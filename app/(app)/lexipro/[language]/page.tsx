import { notFound } from "next/navigation";
import ContentReaderPage from "../../../../components/shared/ContentReaderPage";
import { getLexiproItem } from "../../../../lib/lexipro";

export default function LexiproLanguagePage({
  params,
}: {
  params: { language: string };
}) {
  const item = getLexiproItem(params.language);
  if (!item) {
    notFound();
  }

  return (
    <ContentReaderPage
      eyebrow="Lexipro"
      title={`Lexipro · ${item.language}`}
      description="1,000 Business English curated expressions, idioms, and jargon across 100 categories — each with their respective Spanish, French and Portuguese translations and real-world context examples, all voiced aloud. Learn not only English but also French, Spanish and Portuguese."
      iframeSrc={`/content/lexipro/${item.slug}`}
      backLinks={[{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
