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
      iframeSrc={`/content/lexipro/${item.slug}`}
      backLinks={[{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
