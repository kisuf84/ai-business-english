import Link from "next/link";
import { notFound } from "next/navigation";
import EnglishTrainingLessonReader from "../../../../components/englishTraining/EnglishTrainingLessonReader";
import {
  getEnglishTrainingCategorySlug,
  getEnglishTrainingLesson,
} from "../../../../lib/englishTraining";

export default function EnglishTrainingLessonPage({
  params,
}: {
  params: { lesson: string };
}) {
  const lesson = getEnglishTrainingLesson(params.lesson);
  if (!lesson) {
    notFound();
  }

  const categoryHref = `/english-training/category/${getEnglishTrainingCategorySlug(lesson.category)}`;

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="lumen-chip">English Training</span>
            <span className="lumen-chip">{lesson.category}</span>
          </div>
          <h1 className="mobile-safe-wrap mt-2 text-base font-extrabold leading-snug text-[var(--ink)] sm:text-lg">
            {lesson.title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={categoryHref} className="lumen-secondary-action px-3 py-2 text-xs">
            Back to {lesson.category}
          </Link>
          <Link href="/english-training" className="lumen-secondary-action px-3 py-2 text-xs">
            All English Training
          </Link>
        </div>
      </div>
      <EnglishTrainingLessonReader
        title={lesson.title}
        iframeSrc={`/english-training-content/${lesson.slug}`}
      />
    </section>
  );
}
