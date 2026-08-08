import { listEnglishTrainingLessons, type EnglishTrainingCategory } from "../../../lib/englishTraining";
import EnglishTrainingCategorySections from "../../../components/englishTraining/EnglishTrainingCategorySections";

const CATEGORY_ORDER: EnglishTrainingCategory[] = [
  "General English Training",
  "Business English Training",
  "Business English Scenarios",
];

export default function EnglishTrainingPage() {
  const lessons = listEnglishTrainingLessons();

  return (
    <section className="mobile-page-shell py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 sm:mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            English Training
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            English Training
          </h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Structured training modules and business scenario practice, ready to open in one click.
          </p>
        </div>

        <EnglishTrainingCategorySections lessons={lessons} categories={CATEGORY_ORDER} />
      </div>
    </section>
  );
}
