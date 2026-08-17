import { notFound } from "next/navigation";
import ContentReaderPage from "../../../../components/shared/ContentReaderPage";
import { getBilingualCompendiumItem } from "../../../../lib/bilingualCompendium";

export default function BilingualCompendiumLanguagePage({
  params,
}: {
  params: { language: string };
}) {
  const item = getBilingualCompendiumItem(params.language);
  if (!item) {
    notFound();
  }

  return (
    <ContentReaderPage
      eyebrow="Bilingual Compendium"
      title={`Bilingual Compendium · ${item.language}`}
      description="1,000 audio-ready everyday expressions — each with their respective Spanish, French and Portuguese translations and real-world context examples, all voiced aloud. Learn not only English but also French, Spanish and Portuguese."
      iframeSrc={`/content/bilingual-compendium/${item.slug}`}
      backLinks={[{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
