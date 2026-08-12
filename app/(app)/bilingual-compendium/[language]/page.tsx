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
      iframeSrc={`/content/bilingual-compendium/${item.slug}`}
      backLinks={[{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
