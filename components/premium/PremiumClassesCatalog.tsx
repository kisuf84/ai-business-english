"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Card from "../shared/Card";
import type { PremiumCourse } from "../../lib/premiumClasses";

type PremiumClassesCatalogProps = {
  courses: PremiumCourse[];
};

export default function PremiumClassesCatalog({
  courses,
}: PremiumClassesCatalogProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredCourses = useMemo(() => {
    if (!normalizedQuery) {
      return courses;
    }

    return courses.filter((course) => {
      const moduleTitles = course.modules.map((module) => module.title).join(" ");
      const haystack =
        `${course.title} ${course.subtitle} ${course.description} ${moduleTitles}`.toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [courses, normalizedQuery]);

  return (
    <div className="space-y-6">
      <Card className="rounded-[20px] p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[var(--ink)]">
              Search premium classes
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Search by course title, category, or module title. Leaving the field
              empty shows the full premium catalog.
            </p>
          </div>

          <label className="block w-full md:max-w-[320px]">
            <span className="sr-only">Search premium classes</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courses or modules"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--border-strong)] focus:ring-2 focus:ring-[var(--border-strong)]/50"
            />
          </label>
        </div>
      </Card>

      {filteredCourses.length === 0 ? (
        <Card className="rounded-[20px] p-6 text-center sm:p-8">
          <h2 className="font-serif text-2xl text-[var(--ink)]">
            No premium classes matched
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Try a different keyword or clear the search to see every available
            premium course.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <Link
              key={course.slug}
              href={`/premium-classes/${course.slug}`}
              className="group block min-w-0"
            >
              <Card className="h-full rounded-[20px] p-4 sm:rounded-3xl sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                      {course.subtitle}
                    </p>
                    <h2 className="mobile-safe-wrap mt-2 text-lg font-semibold leading-snug text-[var(--ink)]">
                      {course.title}
                    </h2>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-medium text-[var(--ink-muted)] transition group-hover:border-[var(--accent-gold)] group-hover:text-[var(--ink)]">
                    Open
                  </span>
                </div>

                <p className="mobile-safe-wrap mt-4 text-sm leading-6 text-[var(--ink-muted)]">
                  {course.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
                    {course.moduleCount} modules
                  </span>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
                    {course.level}
                  </span>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
                    Module 1 preview
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
