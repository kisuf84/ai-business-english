import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEnglishTrainingCategoryFromSlug,
  listEnglishTrainingLessons,
} from "../../../../../lib/englishTraining";
import EnglishTrainingCategorySections from "../../../../../components/englishTraining/EnglishTrainingCategorySections";

export default function EnglishTrainingCategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const category = getEnglishTrainingCategoryFromSlug(params.category);
  if (!category) {
    notFound();
  }

  const lessons = listEnglishTrainingLessons();

  return (
    <section className="mobile-page-shell py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-xs text-[var(--ink-muted)]">
          <Link href="/english-training" className="hover:text-[var(--ink)]">
            ← Back to English Training
          </Link>
        </p>

        <div className="mt-3 mb-6 sm:mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            English Training
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            {category}
          </h1>
        </div>

        <EnglishTrainingCategorySections lessons={lessons} categories={[category]} />
      </div>
    </section>
  );
}
