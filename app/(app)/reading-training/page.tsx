import CatalogPageShell from "../../../components/shared/CatalogPageShell";
import ContentCatalogSections from "../../../components/shared/ContentCatalogSections";
import {
  listReadingTrainingItems,
  READING_TRAINING_LEVEL_ORDER,
} from "../../../lib/readingTraining";

export default function ReadingTrainingPage() {
  const items = listReadingTrainingItems();

  return (
    <CatalogPageShell
      eyebrow="Reading Training"
      title="Reading Training"
      description="Reading comprehension practice by level, ready to open in one click."
    >
      <ContentCatalogSections
        groups={READING_TRAINING_LEVEL_ORDER.map((level) => ({
          key: level,
          label: level,
          items: items
            .filter((item) => item.level === level)
            .map((item) => ({
              id: item.id,
              title: item.title,
              href: `/reading-training/${item.slug}`,
              thumbnailUrl: item.thumbnailUrl,
              fallbackLabel: item.level,
              ctaLabel: "Start Reading",
            })),
        }))}
      />
    </CatalogPageShell>
  );
}
