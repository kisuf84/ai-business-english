import Link from "next/link";
import Card from "../../../components/shared/Card";
import { listCourses } from "../../../lib/data/courses";

export default async function MyCoursesPage() {
  let courses = [] as Awaited<ReturnType<typeof listCourses>>;
  let loadError: string | null = null;

  try {
    courses = await listCourses();
  } catch {
    loadError = "We could not load courses right now.";
  }

  return (
    <section className="py-10">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            My Courses
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            My Courses
          </h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Your generated course drafts.
          </p>
        </div>

        {loadError ? (
          <Card className="p-6">
            <p className="text-sm text-[var(--accent-warm)]">{loadError}</p>
          </Card>
        ) : null}

        {!loadError && courses.length === 0 ? (
          <Card className="p-6">
            <h2 className="font-serif text-2xl text-[var(--ink)]">
              No courses yet
            </h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Generate your first course to start your drafts.
            </p>
            <Link
              href="/generator"
              className="mt-4 inline-flex rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-4 py-2 text-xs font-semibold text-[#0c0b0a] hover:bg-[#d4ad55]"
            >
              Generate course
            </Link>
          </Card>
        ) : null}

        {!loadError && courses.length > 0 ? (
          <div className="grid gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="rounded-3xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--ink)]">
                      {course.title}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--ink-muted)]">
                      {course.summary || course.topic}
                    </p>
                    <p className="mt-2 text-xs text-[var(--ink-faint)]">
                      Level: {course.level}
                      {course.industry ? ` • ${course.industry}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/courses/${course.id}`}
                    className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-card)] px-4 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-raised)]"
                  >
                    Open
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
