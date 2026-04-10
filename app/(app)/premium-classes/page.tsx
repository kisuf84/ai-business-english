import Link from "next/link";
import Card from "../../../components/shared/Card";
import { listPremiumCourses } from "../../../lib/premiumClasses";

export const dynamic = "force-static";

export default async function PremiumClassesPage() {
  const courses = await listPremiumCourses();

  return (
    <section className="py-10">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Premium Classes
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            Premium Classes
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--ink-muted)]">
            Browse the full premium course library and open each module inside the app.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.slug}
              href={`/premium-classes/${course.slug}`}
              className="group block"
            >
              <Card className="h-full rounded-3xl p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                      {course.subtitle}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold leading-snug text-[var(--ink)]">
                      {course.title}
                    </h2>
                  </div>
                  <span className="inline-flex rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-medium text-[var(--ink-muted)] transition group-hover:border-[var(--accent-gold)] group-hover:text-[var(--ink)]">
                    Open
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">
                  {course.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
                    {course.moduleCount} modules
                  </span>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
                    HTML viewer
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
