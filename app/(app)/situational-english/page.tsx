import CatalogPageShell from "../../../components/shared/CatalogPageShell";
import ContentCatalogSections from "../../../components/shared/ContentCatalogSections";
import { listSituationalEnglishItems } from "../../../lib/situationalEnglish";

export default function SituationalEnglishPage() {
  const items = listSituationalEnglishItems();

  return (
    <CatalogPageShell
      eyebrow="Situational English"
      title="Situational English"
      description="Real-world conversation practice, ready to open in one click."
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
