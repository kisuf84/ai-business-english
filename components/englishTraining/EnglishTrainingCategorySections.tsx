import Link from "next/link";
import Card from "../shared/Card";
import type { EnglishTrainingCategory, EnglishTrainingLesson } from "../../lib/englishTraining";

export default function EnglishTrainingCategorySections({
  lessons,
  categories,
}: {
  lessons: EnglishTrainingLesson[];
  categories: EnglishTrainingCategory[];
}) {
  return (
    <>
      {categories.map((category) => {
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
    </>
  );
}
