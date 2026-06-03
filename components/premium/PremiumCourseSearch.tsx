"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Card from "../shared/Card";
import Input from "../shared/Input";
import type { PremiumCourse } from "../../lib/premiumClasses";

type PremiumCourseSearchProps = {
  courses: PremiumCourse[];
};

function courseHaystack(course: PremiumCourse) {
  return [
    course.title,
    course.subtitle,
    course.description,
    ...course.modules.map((module) => module.title),
  ]
    .join(" ")
    .toLowerCase();
}

export default function PremiumCourseSearch({ courses }: PremiumCourseSearchProps) {
  const [query, setQuery] = useState("");

  const filteredCourses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return courses.map((course) => ({
        course,
        matchingModules: course.modules.slice(0, 3),
      }));
    }

    return courses
      .filter((course) => courseHaystack(course).includes(normalized))
      .map((course) => ({
        course,
        matchingModules: course.modules
          .filter((module) => module.title.toLowerCase().includes(normalized))
          .slice(0, 4),
      }));
  }, [courses, query]);

  return (
    <>
      <Card className="mb-6 p-4 sm:p-5">
        <label
          htmlFor="premium-course-search"
          className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]"
        >
          Search premium courses
        </label>
        <Input
          id="premium-course-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by course, module, industry, or skill"
          className="mt-3"
        />
      </Card>

      {filteredCourses.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm font-semibold text-[var(--ink)]">No premium courses found.</p>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Try a broader search term or clear the search field.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map(({ course, matchingModules }) => (
            <Link
              key={course.slug}
              href={`/premium-classes/${course.slug}`}
              className="group block"
            >
              <Card className="lumen-card-link h-full p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="lumen-label">{course.subtitle}</p>
                    <h2 className="mobile-safe-wrap lumen-heading mt-2 text-xl leading-snug text-[var(--ink)]">
                      {course.title}
                    </h2>
                  </div>
                  <span className="lumen-secondary-action px-3 py-1 text-[11px]">
                    Open
                  </span>
                </div>

                <p className="mobile-safe-wrap mt-4 text-sm leading-6 text-[var(--ink-muted)]">
                  {course.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="lumen-chip">{course.moduleCount} modules</span>
                  <span className="lumen-chip">Module 1 preview</span>
                </div>

                {matchingModules.length > 0 ? (
                  <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
                    {matchingModules.map((module) => (
                      <p
                        key={module.slug}
                        className="mobile-safe-wrap text-xs leading-5 text-[var(--ink-muted)]"
                      >
                        Module {module.number}: {module.title.replace(/^Module\s+\d+:\s*/i, "")}
                      </p>
                    ))}
                  </div>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
