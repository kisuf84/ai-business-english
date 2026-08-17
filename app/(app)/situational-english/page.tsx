import CatalogPageShell from "../../../components/shared/CatalogPageShell";
import ContentCatalogSections from "../../../components/shared/ContentCatalogSections";
import { listSituationalEnglishItems } from "../../../lib/situationalEnglish";

export default function SituationalEnglishPage() {
  const items = listSituationalEnglishItems();

  return (
    <CatalogPageShell
      eyebrow="Situational English"
      title="Situational English"
      description="Build confidence for real-life communication with 5,000 practical English training exercises designed across five CEFR levels, from A1 to C1. Explore everyday and professional situations, develop useful communication skills, and learn the vocabulary you need to handle each situation naturally and effectively."
    >
      <ContentCatalogSections
        groups={[
          {
            key: "all",
            label: "All Lessons",
            items: items.map((item) => ({
              id: item.id,
              title: item.title,
              href: `/situational-english/${item.slug}`,
              thumbnailUrl: item.thumbnailUrl,
              fallbackLabel: "Situational English",
              ctaLabel: "Start Training",
            })),
          },
        ]}
      />
    </CatalogPageShell>
  );
}
