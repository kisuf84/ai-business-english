import LessonViewer from "../../../../components/lesson/LessonViewer";
import { getLessonById } from "../../../../lib/data/lessons";
import LessonToolbar from "../../../../components/lesson/LessonToolbar";
import Link from "next/link";
import Card from "../../../../components/shared/Card";
import type {
  LessonGenerationApiResponse,
  LessonSourceMeta,
} from "../../../../types/lesson";
import { normalizeLessonOutput } from "../../../../lib/validators/lesson";

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toLocaleDateString();
}

function parseLessonOutput(
  value: unknown,
  fallbackTitle: string
): { lesson: LessonGenerationApiResponse | null; schemaIssues: string[] } {
  let candidate: unknown = value;
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate) as unknown;
    } catch {
      return { lesson: null, schemaIssues: ["Lesson JSON parse failed."] };
    }
  }

  if (!candidate || typeof candidate !== "object") {
    return { lesson: null, schemaIssues: ["Lesson payload is not an object."] };
  }

  const strictCheck = normalizeLessonOutput(candidate, { strict: true });
  const normalized = normalizeLessonOutput(candidate, {
    strict: false,
    allowLegacyFields: true,
  });
  const sourceMeta =
    (candidate as { source_meta?: unknown }).source_meta &&
    typeof (candidate as { source_meta?: unknown }).source_meta === "object"
      ? ((candidate as { source_meta: LessonSourceMeta }).source_meta as LessonSourceMeta)
      : undefined;
  if (!normalized.ok) {
    return {
      lesson: null,
      schemaIssues: strictCheck.ok ? [] : strictCheck.errors,
    };
  }
  return {
    lesson: {
      ...normalized.data,
      title: normalized.data.title?.trim() || fallbackTitle,
      ...(sourceMeta ? { source_meta: sourceMeta } : {}),
    },
    schemaIssues: strictCheck.ok ? [] : strictCheck.errors,
  };
}

export default async function LessonDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { saved?: string; duplicated?: string; archived?: string };
}) {
  let lessonRecord = null;
  let error: string | null = null;
  const showSaved = searchParams?.saved === "1";
  const showDuplicated = searchParams?.duplicated === "1";
  const showArchived = searchParams?.archived === "1";

  try {
    lessonRecord = await getLessonById(params.id);
  } catch {
    error = "We could not load this lesson right now.";
  }

  const parsedLesson = lessonRecord
    ? parseLessonOutput(lessonRecord.content_json, lessonRecord.title || "Lesson")
    : { lesson: null, schemaIssues: [] };
  const safeLesson = parsedLesson.lesson;

  if (process.env.NODE_ENV !== "production" && parsedLesson.schemaIssues.length > 0) {
    console.warn("[LessonDetailPage] Lesson schema issues detected", parsedLesson.schemaIssues);
  }

  return (
    <section className="py-10">
      <div className="mx-auto max-w-[960px]">
        <p className="text-xs text-[var(--ink-muted)]">
          <Link href="/lessons" className="hover:text-[var(--ink)]">
            ← Back to lessons
          </Link>
        </p>
        <h1 className="mt-3 font-serif text-3xl font-normal text-[var(--ink)]">
          {lessonRecord?.title || "Lesson"}
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-faint)]">
          Lesson ID: {params.id}
          {lessonRecord?.status === "archived" ? " • Archived" : ""}
        </p>

        <div className="mt-4 space-y-2 text-sm">
          {showSaved ? (
            <p className="text-[var(--accent)]">Lesson saved successfully.</p>
          ) : null}
          {showDuplicated ? (
            <p className="text-[var(--accent)]">Lesson duplicated.</p>
          ) : null}
          {showArchived ? (
            <p className="text-[var(--accent)]">Lesson archived.</p>
          ) : null}
          {error ? (
            <p className="text-[var(--accent-warm)]">{error}</p>
          ) : null}
          {!error && !lessonRecord ? <p>Lesson not found.</p> : null}
        </div>

        {lessonRecord ? (
          <>
            <Card className="mt-6 p-5 sm:p-6 lg:p-8">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                    Status
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                    {lessonRecord.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                    Visibility
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                    {lessonRecord.visibility}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                    Created
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                    {formatDate(lessonRecord.created_at)}
                  </p>
                </div>
              </div>
              {lessonRecord.visibility === "public" ? (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                    Share link
                  </p>
                  <Link
                    className="mt-2 inline-flex text-sm text-[var(--ink)] underline-offset-4 hover:underline"
                    href={`/share/lesson/${lessonRecord.id}`}
                  >
                    /share/lesson/{lessonRecord.id}
                  </Link>
                </div>
              ) : null}
            </Card>

            {safeLesson ? (
              <Card className="mt-6 p-5 sm:p-6 lg:p-8">
                <LessonToolbar
                  lessonId={lessonRecord.id}
                  status={lessonRecord.status}
                  visibility={lessonRecord.visibility}
                  lesson={safeLesson}
                />
              </Card>
            ) : null}

            {safeLesson ? (
              <Card className="mt-6 overflow-hidden p-0">
                <LessonViewer lesson={safeLesson} />
              </Card>
            ) : (
              <Card className="mt-6">
                <p className="text-sm text-[var(--ink-muted)]">
                  Lesson content is unavailable for this record.
                </p>
              </Card>
            )}
            {process.env.NODE_ENV !== "production" && parsedLesson.schemaIssues.length > 0 ? (
              <Card className="mt-4">
                <p className="text-sm text-[var(--accent-warm)]">
                  Dev note: required lesson schema checks failed for this record.
                </p>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
