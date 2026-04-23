import { getCourseById } from "../../../../lib/data/courses";
import type { CourseModule } from "../../../../types/course";
import Link from "next/link";
import Card from "../../../../components/shared/Card";

function getSafeModules(value: unknown): CourseModule[] {
  if (!value || typeof value !== "object") return [];
  const maybeModules = (value as { modules?: unknown }).modules;
  if (!Array.isArray(maybeModules)) return [];

  return maybeModules
    .filter((item): item is CourseModule => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Record<string, unknown>;
      return (
        typeof candidate.title === "string" &&
        typeof candidate.description === "string" &&
        Array.isArray(candidate.lessons) &&
        candidate.lessons.every((lesson) => typeof lesson === "string")
      );
    })
    .map((module) => ({
      title: module.title,
      description: module.description,
      lessons: module.lessons,
    }));
}

export default async function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let courseRecord = null;
  let error: string | null = null;

  try {
    courseRecord = await getCourseById(params.id);
  } catch {
    error = "We could not load this course right now.";
  }

  const safeModules = getSafeModules(courseRecord?.outline_json);

  return (
    <section className="py-10">
      <div className="mx-auto max-w-[960px]">
        <p className="text-xs text-[var(--ink-muted)]">
          <Link href="/courses" className="hover:text-[var(--ink)]">
            ← Back to premium courses
          </Link>
        </p>
        <h1 className="mt-3 font-serif text-3xl font-normal text-[var(--ink)]">
          {courseRecord?.title || "Course"}
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-faint)]">
          {courseRecord?.topic} · Level {courseRecord?.level}
          {courseRecord?.industry ? ` · ${courseRecord.industry}` : ""}
        </p>

        {error ? (
          <p className="mt-4 text-sm text-[var(--accent-warm)]">{error}</p>
        ) : null}
        {!error && !courseRecord ? <p>Course not found.</p> : null}

        {courseRecord ? (
          <>
            <Card className="mt-6">
              <h2 className="font-serif text-2xl text-[var(--ink)]">
                Summary
              </h2>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                {courseRecord.summary}
              </p>
            </Card>

            <div className="mt-6">
              <h2 className="font-serif text-2xl text-[var(--ink)]">
                Modules
              </h2>
              <div className="mt-4 grid gap-4">
                {safeModules.map(
                  (module: CourseModule) => (
                    <Card key={module.title} className="rounded-3xl p-6">
                      <strong className="text-lg text-[var(--ink)]">
                        {module.title}
                      </strong>
                      <p className="mt-2 text-sm text-[var(--ink-muted)]">
                        {module.description}
                      </p>
                      <ul className="mt-3 list-disc pl-5 text-sm text-[var(--ink)]">
                        {module.lessons.map((lesson) => (
                          <li key={lesson}>{lesson}</li>
                        ))}
                      </ul>
                    </Card>
                  )
                )}
                {safeModules.length === 0 ? (
                  <Card className="rounded-3xl p-6">
                    <p className="text-sm text-[var(--ink-muted)]">
                      Course modules are unavailable for this record.
                    </p>
                  </Card>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
