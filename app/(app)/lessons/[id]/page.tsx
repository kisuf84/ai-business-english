"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import LessonViewer from "../../../../components/lesson/LessonViewer";
import LessonToolbar from "../../../../components/lesson/LessonToolbar";
import Link from "next/link";
import Card from "../../../../components/shared/Card";
import type { LessonGenerationOutput, LessonRecord } from "../../../../types/lesson";
import { normalizeLessonOutput } from "../../../../lib/validators/lesson";
import { authenticatedFetch } from "../../../../lib/api/authenticatedFetch";

type LessonRecordExtended = LessonRecord & {
  video_id?: string | null;
  transcript_text?: string | null;
  transcript_segments?: Array<{ start?: unknown; duration?: unknown; text?: unknown }> | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toLocaleDateString();
}

function parseLessonOutput(
  value: unknown,
  fallbackTitle: string
): { lesson: LessonGenerationOutput | null; schemaIssues: string[] } {
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
    },
    schemaIssues: strictCheck.ok ? [] : strictCheck.errors,
  };
}

function LessonDetailContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [lessonRecord, setLessonRecord] = useState<LessonRecordExtended | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const showSaved = searchParams.get("saved") === "1";
  const showDuplicated = searchParams.get("duplicated") === "1";
  const showArchived = searchParams.get("archived") === "1";

  useEffect(() => {
    async function load() {
      try {
        const res = await authenticatedFetch(`/api/lesson/${params.id}`);
        if (res.status === 401) {
          setError("Please sign in to view this lesson.");
          return;
        }
        if (res.status === 404) {
          return;
        }
        if (!res.ok) {
          setError("We could not load this lesson right now.");
          return;
        }
        const data = (await res.json()) as LessonRecordExtended;
        setLessonRecord(data);
      } catch (err) {
        if (err instanceof Error && err.message === "Authentication required.") {
          setError("Please sign in to view this lesson.");
        } else {
          setError("We could not load this lesson right now.");
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.id]);

  const parsedLesson = lessonRecord
    ? parseLessonOutput(lessonRecord.content_json, lessonRecord.title || "Lesson")
    : { lesson: null, schemaIssues: [] };
  const safeLesson = parsedLesson.lesson;
  const lessonVideoId =
    lessonRecord && typeof lessonRecord.video_id === "string"
      ? lessonRecord.video_id.trim() || null
      : null;
  const lessonTranscriptText =
    lessonRecord && typeof lessonRecord.transcript_text === "string"
      ? lessonRecord.transcript_text.trim() || null
      : null;
  const lessonTranscriptSegments =
    lessonRecord && Array.isArray(lessonRecord.transcript_segments)
      ? lessonRecord.transcript_segments
          .filter((item) => item && typeof item === "object")
          .map((item) => {
            const start =
              typeof item.start === "number" && Number.isFinite(item.start)
                ? item.start
                : null;
            if (start === null || start < 0) return null;
            const duration =
              typeof item.duration === "number" &&
              Number.isFinite(item.duration) &&
              item.duration >= 0
                ? item.duration
                : undefined;
            const text = typeof item.text === "string" ? item.text.trim() : "";
            if (!text) return null;
            return duration === undefined ? { start, text } : { start, duration, text };
          })
          .filter(
            (item): item is { start: number; duration?: number; text: string } => Boolean(item)
          )
      : null;

  if (loading) {
    return (
      <section className="mobile-page-shell">
        <div className="lumen-page">
          <p className="text-sm text-[var(--ink-muted)]">Loading lesson…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mobile-page-shell">
      <div className="lumen-page">
        <p className="text-xs text-[var(--ink-muted)]">
          <Link href="/lessons" className="lumen-chip hover:text-[var(--ink)]">
            Back to lessons
          </Link>
        </p>
        <h1 className="mobile-safe-wrap lumen-page-title mt-4">
          {lessonRecord?.title || "Lesson"}
        </h1>
        {lessonRecord?.status === "archived" ? (
          <p className="lumen-chip mt-3">Archived</p>
        ) : null}

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
            <Card className="mt-6 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <p className="lumen-label">Status</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                    {lessonRecord.status}
                  </p>
                </div>
                <div>
                  <p className="lumen-label">Visibility</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                    {lessonRecord.visibility}
                  </p>
                </div>
                <div>
                  <p className="lumen-label">Created</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                    {formatDate(lessonRecord.created_at)}
                  </p>
                </div>
              </div>
              {lessonRecord.visibility === "public" ? (
                <div className="mt-4">
                  <p className="lumen-label">Share link</p>
                  <Link
                    className="mt-2 inline-flex break-all rounded-full border border-[var(--border)] bg-[var(--glass)] px-3 py-1.5 text-sm text-[var(--ink)] underline-offset-4 hover:underline"
                    href={`/share/lesson/${lessonRecord.id}`}
                  >
                    /share/lesson/{lessonRecord.id}
                  </Link>
                </div>
              ) : null}
            </Card>

            {safeLesson ? (
              <Card className="mt-6 p-5 sm:p-6">
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
                <LessonViewer
                  lesson={safeLesson}
                  videoId={lessonVideoId}
                  transcriptText={lessonTranscriptText}
                  transcriptSegments={lessonTranscriptSegments}
                />
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

export default function LessonDetailPage() {
  return (
    <Suspense>
      <LessonDetailContent />
    </Suspense>
  );
}
