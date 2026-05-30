"use client";

import Link from "next/link";
import Card from "../shared/Card";
import type { LessonRecord } from "../../types/lesson";

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toLocaleDateString();
}

export default function LessonLibraryList({
  lessons,
  deletingId,
  onDelete,
}: {
  lessons: LessonRecord[];
  deletingId: string | null;
  onDelete: (id: string) => void;
}) {
  if (lessons.length === 0) {
    return (
      <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)] p-6 text-sm text-[var(--ink-muted)] backdrop-blur">
        No lessons match your filters.
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4">
      {lessons.map((lesson) => (
        <div key={lesson.id} className="relative">
          <Link href={`/lessons/${lesson.id}`} className="block">
            <Card className="lumen-card-link p-5 sm:p-6 sm:pr-28">
              <div className="flex items-start justify-between gap-4">
                <strong className="mobile-safe-wrap lumen-heading text-2xl leading-tight">
                  {lesson.title}
                </strong>
                {lesson.status === "archived" ? (
                  <span className="lumen-chip">
                    Archived
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                {lesson.topic}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="lumen-chip">{lesson.level}</span>
                {lesson.industry ? <span className="lumen-chip">{lesson.industry}</span> : null}
                <span className="lumen-chip">Created {formatDate(lesson.created_at)}</span>
              </div>
            </Card>
          </Link>
          <div className="mt-2 sm:hidden">
            <button
              onClick={() => onDelete(lesson.id)}
              disabled={deletingId === lesson.id}
              className="lumen-focus w-full rounded-full border border-[var(--border)] bg-[var(--glass)] px-3 py-2 text-xs font-bold text-[var(--ink-muted)] transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-40"
            >
              {deletingId === lesson.id ? "Deleting…" : "Delete"}
            </button>
          </div>
          <button
            onClick={() => onDelete(lesson.id)}
            disabled={deletingId === lesson.id}
            className="lumen-focus absolute right-5 top-5 hidden rounded-full border border-[var(--border)] bg-[var(--glass)] px-3 py-1.5 text-xs font-bold text-[var(--ink-muted)] transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-40 sm:block"
          >
            {deletingId === lesson.id ? "Deleting…" : "Delete"}
          </button>
        </div>
      ))}
    </div>
  );
}
