"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Card from "../shared/Card";
import type { PremiumCourse } from "../../lib/premiumClasses";

type PremiumCourseDetailProps = {
  course: PremiumCourse;
};

export default function PremiumCourseDetail({
  course,
}: PremiumCourseDetailProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredModules = useMemo(() => {
    if (!normalizedQuery) {
      return course.modules;
    }

    return course.modules.filter((module) => {
      const haystack = `module ${module.number} ${module.title}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [course.modules, normalizedQuery]);

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">
              {course.subtitle}
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {course.moduleCount} modules available. Module 1 is open as preview
              content. Remaining modules stay locked in Phase 2A.
            </p>
            <p className="mt-1 text-sm text-[var(--ink-faint)]">
              Level: {course.level}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <label className="block w-full sm:min-w-[260px]">
              <span className="sr-only">Search modules</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search modules"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--border-strong)] focus:ring-2 focus:ring-[var(--border-strong)]/50"
              />
            </label>
            <Link
              href="/premium-classes"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-card)] px-4 py-3 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-raised)]"
            >
              Back to Premium Classes
            </Link>
          </div>
        </div>
      </Card>

      {filteredModules.length === 0 ? (
        <Card className="rounded-[20px] p-6 text-center sm:p-8">
          <h2 className="font-serif text-2xl text-[var(--ink)]">
            No modules matched
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Clear the search to restore the full module list.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredModules.map((module) => {
            const content = (
              <Card className="rounded-[20px] p-4 sm:rounded-3xl sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                        Module {module.number}
                      </p>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                          module.isLocked
                            ? "border-[var(--border)] text-[var(--ink-faint)]"
                            : "border-[var(--accent-gold)] text-[var(--ink)]"
                        }`}
                      >
                        {module.isLocked ? "Locked" : "Preview"}
                      </span>
                    </div>
                    <h2 className="mobile-safe-wrap mt-2 text-lg font-semibold leading-snug text-[var(--ink)]">
                      {module.title}
                    </h2>
                    {module.isLocked ? (
                      <p className="mt-3 text-sm text-[var(--ink-muted)]">
                        Premium access required to open this module.
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-[var(--ink-muted)]">
                        Open preview content in the immersive reader.
                      </p>
                    )}
                  </div>
                  <span className="inline-flex shrink-0 rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
                    {module.isLocked ? "Locked" : "Open"}
                  </span>
                </div>
              </Card>
            );

            if (module.isLocked) {
              return <div key={module.slug}>{content}</div>;
            }

            return (
              <Link
                key={module.slug}
                href={`/premium-classes/${course.slug}/${module.slug}`}
                className="group block min-w-0"
              >
                {content}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
