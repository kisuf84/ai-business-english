import CatalogPageShell from "../../../components/shared/CatalogPageShell";
import ContentCatalogSections from "../../../components/shared/ContentCatalogSections";
import { listListeningTrainingItems } from "../../../lib/listeningTraining";

export default function ListeningTrainingPage() {
  const items = listListeningTrainingItems();

  return (
    <CatalogPageShell
      eyebrow="Listening Training"
      title="Listening Training"
      description="Structured listening practice by level, ready to open in one click."
    >
      <ContentCatalogSections
        groups={[
          {
            key: "all",
            label: "All Lessons",
            items: items.map((item) => ({
              id: item.id,
              title: item.title,
              href: `/listening-training/${item.slug}`,
              thumbnailUrl: item.thumbnailUrl,
              fallbackLabel: item.level,
              ctaLabel: "Start Training",
            })),
          },
        ]}
      />
    </CatalogPageShell>
  );
}
