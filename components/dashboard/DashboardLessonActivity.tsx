"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "../shared/Card";
import { authenticatedFetch } from "../../lib/api/authenticatedFetch";
import type { LessonRecord } from "../../types/lesson";

export default function DashboardLessonActivity() {
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadLessons = async () => {
      try {
        const response = await authenticatedFetch("/api/lesson/list", {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as LessonRecord[] | null;
        if (!active) return;
        setLessons(response.ok && Array.isArray(payload) ? payload : []);
      } catch {
        if (active) setLessons([]);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadLessons();

    return () => {
      active = false;
    };
  }, []);

  const recentLessons = lessons.slice(0, 3);

  return (
    <section className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="p-5 sm:p-7">
        <h2 className="lumen-heading m-0 text-[26px]">
          Recent lesson activity
        </h2>
        <p className="mb-4 mt-2 text-sm text-[var(--ink-muted)] sm:mb-[22px] sm:text-[15px]">
          Saved lessons from your real lesson library.
        </p>
        <div className="space-y-3">
          {!isLoading && recentLessons.length === 0 ? (
            <p className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)] p-4 text-sm text-[var(--ink-muted)]">
              No lessons generated yet. Create a lesson to start populating this dashboard.
            </p>
          ) : (
            recentLessons.map((lesson, index) => (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="lesson-card flex items-center justify-between gap-3 px-3 py-3 sm:px-4"
              >
                <div className="min-w-0">
                  <p className="mobile-safe-wrap text-sm font-semibold text-[var(--ink)]">
                    {lesson.title}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    Recent lesson {index + 1}
                  </p>
                </div>
                <span className="shrink-0 text-xs uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                  Open
                </span>
              </Link>
            ))
          )}
        </div>
      </Card>

      <Card className="p-5 sm:p-7">
        <h2 className="lumen-heading m-0 text-[26px]">Workspace status</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
          Langslate is ready for lesson generation, simulation practice, and resource access.
        </p>
        <div className="mt-5 grid gap-3">
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)] p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
              CEFR level
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
              Set per lesson or simulation
            </p>
          </div>
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)] p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
              Library
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
              {isLoading ? "Loading…" : `${lessons.length} saved lesson${lessons.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}
