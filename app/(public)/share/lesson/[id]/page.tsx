import LessonContent from "../../../../../components/lesson/LessonContent";
import { getLessonById } from "../../../../../lib/data/lessons";
import { normalizeLessonOutput } from "../../../../../lib/validators/lesson";
import Card from "../../../../../components/shared/Card";

function formatTimestamp(seconds: number): string {
  const clamped = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function groupSegments(
  segments: Array<{ start: number; duration?: number; text: string }>
): Array<{ start: number; text: string }> {
  const sorted = [...segments]
    .filter((item) => Number.isFinite(item.start) && item.start >= 0 && item.text.trim())
    .sort((a, b) => a.start - b.start);
  if (sorted.length === 0) return [];

  const groups: Array<{ start: number; text: string }> = [];
  let buffer: Array<{ start: number; text: string }> = [];

  const sentenceCount = (value: string) => (value.match(/[.!?]+(?=\s|$)/g) || []).length;
  const flush = () => {
    if (buffer.length === 0) return;
    groups.push({
      start: buffer[0].start,
      text: buffer.map((item) => item.text).join(" ").replace(/\s+/g, " ").trim(),
    });
    buffer = [];
  };

  for (const segment of sorted) {
    const text = segment.text.replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (buffer.length === 0) {
      buffer.push({ start: segment.start, text });
      continue;
    }
    const previous = buffer[buffer.length - 1];
    const candidate = `${buffer.map((item) => item.text).join(" ")} ${text}`;
    const gap = Math.max(0, segment.start - previous.start);
    if (candidate.length >= 760 || sentenceCount(candidate) >= 5 || ((candidate.length >= 520 || sentenceCount(candidate) >= 3) && gap > 18)) {
      flush();
      buffer.push({ start: segment.start, text });
      continue;
    }
    buffer.push({ start: segment.start, text });
  }

  flush();
  return groups;
}

export default async function SharedLessonPage({
  params,
}: {
  params: { id: string };
}) {
  let lessonRecord = null;
  let error: string | null = null;

  try {
    lessonRecord = await getLessonById(params.id);
  } catch {
    error = "This lesson is unavailable.";
  }

  if (!lessonRecord || lessonRecord.visibility !== "public") {
    return (
      <section className="mobile-page-shell py-10">
        <div className="lumen-page">
          <Card className="p-6">
          <h1 className="lumen-heading text-3xl text-[var(--ink)]">Lesson Unavailable</h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            This lesson is not available to view.
          </p>
          </Card>
        </div>
      </section>
    );
  }

  const lessonVideoId =
    typeof (lessonRecord as { video_id?: unknown }).video_id === "string"
      ? (((lessonRecord as { video_id?: string | null }).video_id || "").trim() || null)
      : null;
  const lessonTranscriptText =
    typeof (lessonRecord as { transcript_text?: unknown }).transcript_text === "string"
      ? (((lessonRecord as { transcript_text?: string | null }).transcript_text || "").trim() ||
          null)
      : null;
  const lessonTranscriptSegments = Array.isArray(
    (lessonRecord as { transcript_segments?: unknown }).transcript_segments
  )
    ? ((lessonRecord as {
        transcript_segments?: Array<{ start?: unknown; duration?: unknown; text?: unknown }>;
      }).transcript_segments || [])
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const start =
            typeof item.start === "number" && Number.isFinite(item.start)
              ? item.start
              : null;
          const text = typeof item.text === "string" ? item.text.trim() : "";
          if (start === null || start < 0 || !text) return null;
          const duration =
            typeof item.duration === "number" && Number.isFinite(item.duration) && item.duration >= 0
              ? item.duration
              : undefined;
          return duration === undefined ? { start, text } : { start, duration, text };
        })
        .filter(
          (
            item
          ): item is { start: number; duration?: number; text: string } => Boolean(item)
        )
    : null;
  const groupedSegments =
    lessonTranscriptSegments && lessonTranscriptSegments.length > 0
      ? groupSegments(lessonTranscriptSegments)
      : [];

  return (
    <section className="mobile-page-shell py-10">
      <div className="lumen-page">
      <p className="lumen-chip">
        Shared Lesson
      </p>
      <h1 className="mobile-safe-wrap lumen-page-title mt-4">
        {lessonRecord.title}
      </h1>
      <p className="mobile-safe-wrap mt-3 text-sm text-[var(--ink-muted)]">
        Level {lessonRecord.level} · {lessonRecord.topic}
      </p>
      {error ? <p className="mt-4 text-sm text-[var(--accent-warm)]">{error}</p> : null}
      {lessonVideoId ? (
        <Card className="mt-6 p-4 sm:p-5">
          <p className="lumen-label mb-3">
            Source Video
          </p>
          <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)]">
            <iframe
              src={`https://www.youtube.com/embed/${lessonVideoId}?rel=0`}
              title="Lesson video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
          {lessonTranscriptText || groupedSegments.length > 0 ? (
            <div className="mt-3">
              <details className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)]">
                <summary className="cursor-pointer list-none select-none px-4 py-3 text-sm font-semibold text-[var(--ink)]">
                  Transcript
                </summary>
                <div className="flex max-h-[320px] flex-col gap-3 overflow-y-auto border-t border-[var(--border)] px-4 py-3">
                  {groupedSegments.length > 0
                    ? groupedSegments.map((segment, index) => (
                        <div key={`${index}-${segment.start}`}>
                          <span className="mr-2 inline-block min-w-[52px] font-mono text-[11px] font-semibold tracking-[0.04em] text-[var(--accent)]">
                            {formatTimestamp(segment.start)}
                          </span>
                          <span className="whitespace-pre-wrap text-[13px] leading-6 text-[var(--ink-muted)]">
                            {segment.text}
                          </span>
                        </div>
                      ))
                    : <p className="whitespace-pre-wrap text-[13px] leading-6 text-[var(--ink-muted)]">{lessonTranscriptText}</p>}
                </div>
              </details>
            </div>
          ) : null}
        </Card>
      ) : null}
      {(() => {
        const strictCheck = normalizeLessonOutput(lessonRecord.content_json, {
          strict: true,
        });
        const normalized = normalizeLessonOutput(lessonRecord.content_json, {
          strict: false,
          allowLegacyFields: true,
        });
        if (process.env.NODE_ENV !== "production" && !strictCheck.ok) {
          console.warn(
            "[SharedLessonPage] Lesson schema issues detected",
            strictCheck.errors
          );
        }
        if (!normalized.ok) {
          return <Card className="mt-6"><p className="text-sm text-[var(--ink-muted)]">This lesson content is unavailable.</p></Card>;
        }
        return (
          <>
            {process.env.NODE_ENV !== "production" && !strictCheck.ok ? (
              <p className="mt-4 text-sm text-[var(--accent-warm)]">
                Dev note: required lesson schema checks failed for this shared lesson.
              </p>
            ) : null}
            <LessonContent lesson={normalized.data} />
          </>
        );
      })()}
      </div>
    </section>
  );
}
