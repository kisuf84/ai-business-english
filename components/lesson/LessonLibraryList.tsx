"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "../shared/Card";
import type { LessonRecord } from "../../types/lesson";

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toLocaleDateString();
}

export default function LessonLibraryList({
  initialLessons,
}: {
  initialLessons: LessonRecord[];
}) {
  const [lessons, setLessons] = useState(initialLessons);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this lesson? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const response = await fetch("/api/lesson/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        setLessons((prev) => prev.filter((l) => l.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (lessons.length === 0) {
    return (
      <p className="mt-4 text-sm text-[var(--ink-muted)]">
        No lessons match your filters.
      </p>
    );
  }

  return (
    <div className="mt-6 grid gap-4">
      {lessons.map((lesson) => (
        <div key={lesson.id} className="relative">
          <Link href={`/lessons/${lesson.id}`} className="block">
            <Card className="rounded-3xl p-6 pr-24">
              <div className="flex items-start justify-between gap-4">
                <strong className="text-lg text-[var(--ink)]">
                  {lesson.title}
                </strong>
                {lesson.status === "archived" ? (
                  <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                    Archived
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                {lesson.topic}
              </p>
              <p className="text-sm text-[var(--ink-muted)]">
                Level: {lesson.level}
                {lesson.industry ? ` • ${lesson.industry}` : ""}
              </p>
              <p className="mt-2 text-xs text-[var(--ink-faint)]">
                Created: {formatDate(lesson.created_at)}
              </p>
            </Card>
          </Link>
          <button
            onClick={() => void handleDelete(lesson.id)}
            disabled={deletingId === lesson.id}
            className="absolute right-5 top-5 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs text-[var(--ink-muted)] transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-40"
          >
            {deletingId === lesson.id ? "Deleting…" : "Delete"}
          </button>
        </div>
      ))}
    </div>
  );
}
