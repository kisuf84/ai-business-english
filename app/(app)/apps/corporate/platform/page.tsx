import type { Metadata } from "next";
import Link from "next/link";
import Card from "../../../../../components/shared/Card";
import CatalogPageShell from "../../../../../components/shared/CatalogPageShell";
import { corporateFamilyHref, countCorporateLessons, listCorporateFamilies } from "../../../../../lib/langslateCorporate";

const families = listCorporateFamilies();
const totalLessons = families.reduce((sum, family) => sum + countCorporateLessons(family), 0);

export const metadata: Metadata = {
  title: "Langslate Corporate Platform",
  description: `${totalLessons.toLocaleString("en-US")} live professional English lessons across four corporate libraries.`,
};

export default function LangslateCorporatePlatformPage() {
  return (
    <CatalogPageShell
      eyebrow="Langslate Corporate"
      title="Corporate Platform"
      description={`${totalLessons.toLocaleString("en-US")} live professional English lessons across professions, industries, departments, and Langslate Pro.`}
      backLink={{ href: "/apps/corporate", label: "Corporate landing" }}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {families.map((family) => {
          const lessonCount = countCorporateLessons(family);

          return (
            <Link key={family.slug} href={corporateFamilyHref(family.slug)} className="group block">
              <Card className="lumen-card-link h-full">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                  {family.categories.length} categories
                </p>
                <h2 className="mobile-safe-wrap mt-3 text-xl font-semibold text-[var(--ink)]">
                  {family.label}
                </h2>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  {lessonCount.toLocaleString("en-US")} lessons
                </p>
                <span className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">
                  Open library →
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </CatalogPageShell>
  );
}
