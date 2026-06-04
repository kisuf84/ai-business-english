import Link from "next/link";
import { cookies } from "next/headers";
import Card from "../../../components/shared/Card";
import { listCourses } from "../../../lib/data/courses";
import { getAuthUserFromCookieHeader } from "../../../lib/supabase/auth";

export default async function MyCoursesPage() {
  let courses = [] as Awaited<ReturnType<typeof listCourses>>;
  let loadError: string | null = null;
  const authUser = await getAuthUserFromCookieHeader(cookies().toString());

  if (!authUser) {
    loadError = "Please sign in to view your courses.";
  }

  if (authUser) {
    try {
      courses = await listCourses(authUser.id);
    } catch {
      loadError = "We could not load courses right now.";
    }
  }

  return (
    <section className="mobile-page-shell">
      <div className="lumen-page">
        <div className="mb-8">
          <p className="lumen-chip">
            Premium Courses
          </p>
          <h1 className="lumen-page-title mt-4">
            Premium Courses
          </h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Your premium course library.
          </p>
        </div>

        {loadError ? (
          <Card className="p-6">
            <p className="text-sm text-[var(--accent-warm)]">{loadError}</p>
          </Card>
        ) : null}

        {!loadError && courses.length === 0 ? (
          <Card className="p-6">
            <h2 className="lumen-heading text-2xl text-[var(--ink)]">
              No premium courses yet
            </h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Premium courses will appear here when available.
            </p>
          </Card>
        ) : null}

        {!loadError && courses.length > 0 ? (
          <div className="grid gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="lumen-card-link p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="lumen-heading text-xl text-[var(--ink)]">
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
                    className="lumen-secondary-action"
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
