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
      description="Build stronger reading skills with 1,000 carefully designed reading exercises across five CEFR levels, from A1 to C1. Each level includes 200 engaging readings, with 8 comprehension questions per reading to help you develop vocabulary, understanding, and reading accuracy step by step."
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
