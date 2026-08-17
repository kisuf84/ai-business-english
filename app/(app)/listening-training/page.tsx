import CatalogPageShell from "../../../components/shared/CatalogPageShell";
import ContentCatalogSections from "../../../components/shared/ContentCatalogSections";
import { listListeningTrainingItems } from "../../../lib/listeningTraining";

export default function ListeningTrainingPage() {
  const items = listListeningTrainingItems();

  return (
    <CatalogPageShell
      eyebrow="Listening Training"
      title="Listening Training"
      description="Strengthen your English listening skills with 100 carefully designed listening exercises per CEFR level (A1 to C1), each followed by 5 comprehension questions to help you understand spoken English with greater confidence."
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
