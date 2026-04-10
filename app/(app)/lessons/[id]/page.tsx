import LessonViewer from "../../../../components/lesson/LessonViewer";
import { getLessonById } from "../../../../lib/data/lessons";
import LessonToolbar from "../../../../components/lesson/LessonToolbar";
import Link from "next/link";
import Card from "../../../../components/shared/Card";
import type {
  LessonGenerationOutput,
  VocabularyItem,
  LessonQuestion,
} from "../../../../types/lesson";

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toLocaleDateString();
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toVocabularyArray(value: unknown): VocabularyItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is VocabularyItem =>
      item !== null &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).term === "string" &&
      typeof (item as Record<string, unknown>).definition === "string"
  );
}

function toLessonQuestionArray(value: unknown): LessonQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const q = item as Record<string, unknown>;
    const options = Array.isArray(q.options)
      ? q.options.filter((opt): opt is string => typeof opt === "string")
      : [];
    const normalizedCorrectIndex =
      typeof q.correct_index === "number"
        ? q.correct_index
        : typeof q.correct === "number"
          ? q.correct
          : -1;
    if (
      typeof q.id !== "string" ||
      typeof q.question !== "string" ||
      options.length === 0 ||
      normalizedCorrectIndex < 0 ||
      normalizedCorrectIndex >= options.length
    ) {
      return [];
    }
    return [
      {
        id: q.id,
        question: q.question,
        options,
        correct_index: normalizedCorrectIndex,
        instruction: typeof q.instruction === "string" ? q.instruction : undefined,
        sentence: typeof q.sentence === "string" ? q.sentence : undefined,
      } satisfies LessonQuestion,
    ];
  });
}

function parseLessonOutput(
  value: unknown,
  fallbackTitle: string
): LessonGenerationOutput | null {
  let candidate: unknown = value;
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate) as unknown;
    } catch {
      return null;
    }
  }

  if (!candidate || typeof candidate !== "object") return null;
  const data = candidate as Record<string, unknown>;

  const lesson: LessonGenerationOutput = {
    title:
      typeof data.title === "string" && data.title.trim()
        ? data.title
        : fallbackTitle,
    summary: typeof data.summary === "string" ? data.summary : "",
    objectives: toStringArray(data.objectives),
    vocabulary: toVocabularyArray(data.vocabulary),
    reading_text: typeof data.reading_text === "string" ? data.reading_text : "",
    comprehension_questions: toLessonQuestionArray(data.comprehension_questions),
    grammar_exercises: toLessonQuestionArray(data.grammar_exercises),
    role_play: typeof data.role_play === "string" ? data.role_play : "",
    quiz: toLessonQuestionArray(data.quiz),
  };

  const hasMeaningfulContent =
    Boolean(lesson.summary.trim()) ||
    Boolean(lesson.reading_text.trim()) ||
    Boolean(lesson.role_play.trim()) ||
    lesson.objectives.length > 0 ||
    lesson.vocabulary.length > 0 ||
    lesson.comprehension_questions.length > 0 ||
    lesson.grammar_exercises.length > 0 ||
    lesson.quiz.length > 0;

  return hasMeaningfulContent ? lesson : null;
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

  const safeLesson = lessonRecord
    ? parseLessonOutput(lessonRecord.content_json, lessonRecord.title || "Lesson")
    : null;

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
          </>
        ) : null}
      </div>
    </section>
  );
}
