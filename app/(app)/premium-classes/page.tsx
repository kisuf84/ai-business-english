import Link from "next/link";
import Card from "../../../components/shared/Card";
import { listPremiumCourses } from "../../../lib/premiumClasses";

export const dynamic = "force-static";

export default async function PremiumClassesPage() {
  const courses = await listPremiumCourses();

  return (
    <section className="mobile-page-shell">
      <div className="lumen-page">
        <div className="mb-6 sm:mb-8">
          <p className="lumen-chip">
            Premium Classes
          </p>
          <h1 className="lumen-page-title mt-4">
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
              <Card className="lumen-card-link h-full p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="lumen-label">
                      {course.subtitle}
                    </p>
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
                  <span className="lumen-chip">
                    {course.moduleCount} modules
                  </span>
                  <span className="lumen-chip">
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
