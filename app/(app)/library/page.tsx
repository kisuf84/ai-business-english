import Link from "next/link";
import Card from "../../../components/shared/Card";
import Input from "../../../components/shared/Input";
import { listLessons } from "../../../lib/data/lessons";
import type { LessonRecord } from "../../../types/lesson";

export const dynamic = "force-dynamic";

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toLocaleDateString();
}

function getSourceBadge(lesson: LessonRecord): string | null {
  const source = lesson.source_url?.trim();
  if (source) {
    try {
      const host = new URL(source).hostname.replace(/^www\./, "");
      if (host.includes("youtube.com") || host.includes("youtu.be")) {
        return "YouTube";
      }
      return "Article";
    } catch {
      return "Manual";
    }
  }

  if (lesson.topic?.trim()) return "Topic";
  return null;
}

function formatLessonType(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "General";
}

export default async function LibraryPage() {
  let lessons = [] as Awaited<ReturnType<typeof listLessons>>;
  let loadError: string | null = null;

  try {
    lessons = await listLessons();
  } catch {
    loadError = "We could not load lessons right now.";
  }

  return (
    <section className="mobile-page-shell py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-6 sm:mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Lesson Library
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            Lesson Library
          </h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            All generated lessons in one place.
          </p>
        </div>

        <Card className="p-5 sm:p-7">
          <div className="grid gap-2">
            <label htmlFor="lesson_search" className="text-sm font-medium">
              Search lessons
            </label>
            <Input
              id="lesson_search"
              placeholder="Search by title or topic"
              aria-label="Search lessons"
            />
          </div>
        </Card>

        <div className="mt-6">
          {loadError ? (
            <Card className="p-6">
              <p className="text-sm text-[var(--accent-warm)]">{loadError}</p>
            </Card>
          ) : null}

          {!loadError && lessons.length === 0 ? (
            <Card className="p-6">
              <h2 className="font-serif text-2xl text-[var(--ink)]">
                No lessons yet
              </h2>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                Generate your first lesson to start building your library.
              </p>
              <Link
                href="/lesson/new"
                className="mt-4 inline-flex rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-4 py-2 text-xs font-semibold text-[#0c0b0a] hover:bg-[#d4ad55]"
              >
                Create lesson
              </Link>
            </Card>
          ) : null}

          {!loadError && lessons.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {lessons.map((lesson) => {
                const sourceBadge = getSourceBadge(lesson);

                return (
                  <Link
                    key={lesson.id}
                    href={`/lessons/${lesson.id}`}
                    className="group block"
                  >
                    <Card className="h-full rounded-[20px] p-4 sm:rounded-3xl sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="mobile-safe-wrap text-lg font-semibold leading-snug text-[var(--ink)]">
                          {lesson.title}
                        </h2>
                        <p className="mobile-safe-wrap mt-1 text-sm text-[var(--ink-muted)]">
                          {lesson.topic}
                        </p>
                      </div>
                      <span className="inline-flex rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-medium text-[var(--ink-muted)] transition group-hover:border-[var(--accent-gold)] group-hover:text-[var(--ink)]">
                        Open
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
                        Level {lesson.level}
                      </span>
                      <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
                        {formatLessonType(lesson.lesson_type)}
                      </span>
                      {sourceBadge ? (
                        <span className="rounded-full border border-[var(--accent-gold)] bg-[var(--accent-gold-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink)]">
                          {sourceBadge}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 text-xs text-[var(--ink-faint)]">
                      <p>Created {formatDate(lesson.created_at)}</p>
                    </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
