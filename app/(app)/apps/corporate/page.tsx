import Link from "next/link";
import Card from "../../../../components/shared/Card";
import CatalogPageShell from "../../../../components/shared/CatalogPageShell";
import {
  CORPORATE_FAMILY_COPY,
  corporateFamilyHref,
  countCorporateLessons,
  listCorporateFamilies,
} from "../../../../lib/langslateCorporate";

export default function LangslateCorporatePage() {
  const families = listCorporateFamilies();

  return (
    <CatalogPageShell
      eyebrow="Langslate Apps"
      title="Langslate Corporate"
      description="Business English by industry, department, program and profession."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {families.map((family) => {
          const copy = CORPORATE_FAMILY_COPY[family.slug];
          const lessonCount = countCorporateLessons(family);
          return (
            <Link key={family.slug} href={corporateFamilyHref(family.slug)} className="group block">
              <Card className="lumen-card-link h-full">
                <div className="flex h-full flex-col justify-between gap-5">
                  <div>
                    <h2 className="font-serif text-2xl font-normal text-[var(--ink)]">{family.label}</h2>
                    <p className="mt-2 text-sm text-[var(--ink-muted)]">{copy.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                      {family.categories.length} {copy.categoryNounPlural} · {lessonCount.toLocaleString("en-US")}{" "}
                      {copy.lessonNounPlural}
                    </p>
                    <span className="lumen-secondary-action px-4 py-2 text-xs font-semibold">Explore</span>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </CatalogPageShell>
  );
}
