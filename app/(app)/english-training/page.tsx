import Link from "next/link";
import Card from "../../../components/shared/Card";
import {
  listEnglishTrainingLessons,
  type EnglishTrainingCategory,
} from "../../../lib/englishTraining";

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

        {CATEGORY_ORDER.map((category) => {
          const categoryLessons = lessons.filter((lesson) => lesson.category === category);
          if (categoryLessons.length === 0) return null;

          return (
            <div key={category} className="mb-8 last:mb-0 sm:mb-10">
              <h2 className="mb-4 text-lg font-bold text-[var(--ink)] sm:mb-5">
                {category}
              </h2>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {categoryLessons.map((lesson) => (
                  <Card key={lesson.id} className="rounded-2xl p-4 sm:p-5">
                    <div className="flex h-full flex-col justify-between gap-4">
                      <h3 className="mobile-safe-wrap text-base font-semibold leading-snug text-[var(--ink)]">
                        {lesson.title}
                      </h3>
                      <Link
                        href={`/english-training/${lesson.slug}`}
                        className="inline-flex w-full justify-center rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-4 py-2 text-xs font-semibold text-[#0c0b0a] transition hover:bg-[#d4ad55] sm:w-auto"
                      >
                        Open Lesson
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
