import Link from "next/link";
import { notFound } from "next/navigation";
import Card from "../../../../components/shared/Card";
import { getEnglishTrainingLesson } from "../../../../lib/englishTraining";

export default function EnglishTrainingLessonPage({
  params,
}: {
  params: { lesson: string };
}) {
  const lesson = getEnglishTrainingLesson(params.lesson);
  if (!lesson) {
    notFound();
  }

  return (
    <section className="py-10">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-xs text-[var(--ink-muted)]">
          <Link href="/english-training" className="hover:text-[var(--ink)]">
            ← Back to English Training
          </Link>
        </p>

        <div className="mt-3 mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            {lesson.category}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            {lesson.title}
          </h1>
        </div>

        <Card className="overflow-hidden rounded-3xl p-3 sm:p-5">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]">
            <iframe
              src={`/english-training-content/${lesson.slug}`}
              title={`${lesson.title} lesson`}
              style={{ width: "100%", height: "min(86vh, 980px)", minHeight: "60vh", border: "none" }}
              allow="fullscreen"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </Card>
      </div>
    </section>
  );
}
