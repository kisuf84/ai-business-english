import Link from "next/link";
import Card from "./Card";
import LessonThumbnail from "../englishTraining/LessonThumbnail";

export type CatalogCardItem = {
  id: string;
  title: string;
  href: string;
  thumbnailUrl?: string;
  fallbackLabel?: string;
  ctaLabel?: string;
};

export type CatalogGroup = {
  key: string;
  label: string;
  items: CatalogCardItem[];
};

/**
 * Generic thumbnail-led card grid, grouped into labeled sections. Originally
 * built for English Training; every new content library reuses this instead
 * of duplicating the same card-grid JSX per section. Keep this component
 * free of any single section's naming/vocabulary.
 */
export default function ContentCatalogSections({
  groups,
  defaultCtaLabel = "Open Lesson",
}: {
  groups: CatalogGroup[];
  defaultCtaLabel?: string;
}) {
  return (
    <>
      {groups.map((group) => {
        if (group.items.length === 0) return null;

        return (
          <div key={group.key} className="mb-8 last:mb-0 sm:mb-10">
            <h2 className="mb-4 text-lg font-bold text-[var(--ink)] sm:mb-5">
              {group.label}
            </h2>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item) => {
                const ctaLabel = item.ctaLabel ?? defaultCtaLabel;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group block"
                    aria-label={`${item.title} — ${ctaLabel}`}
                  >
                    <Card className="lesson-card">
                      <div className="flex h-full flex-col gap-4">
                        <LessonThumbnail
                          src={item.thumbnailUrl}
                          title={item.title}
                          fallbackLabel={item.fallbackLabel ?? group.label}
                        />
                        <div className="flex flex-1 flex-col justify-between gap-4">
                          <h3 className="mobile-safe-wrap text-base font-semibold leading-snug text-[var(--ink)]">
                            {item.title}
                          </h3>
                          <span className="inline-flex w-full justify-center rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-4 py-2 text-xs font-semibold text-[#0c0b0a] transition group-hover:bg-[#d4ad55] sm:w-auto">
                            {ctaLabel}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
