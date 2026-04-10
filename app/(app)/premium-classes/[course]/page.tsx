import Link from "next/link";
import { notFound } from "next/navigation";
import Card from "../../../../components/shared/Card";
import { getPremiumCourse, listPremiumCourses } from "../../../../lib/premiumClasses";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const courses = await listPremiumCourses();
  return courses.map((course) => ({ course: course.slug }));
}

type PremiumCoursePageProps = {
  params: { course: string };
};

export default async function PremiumCoursePage({ params }: PremiumCoursePageProps) {
  const course = await getPremiumCourse(params.course);

  if (!course) {
    notFound();
  }

  return (
    <section className="mobile-page-shell py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-6 sm:mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Premium Classes
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            {course.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">
            {course.description}
          </p>
        </div>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">{course.subtitle}</p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {course.moduleCount} modules available
              </p>
            </div>
            <Link
              href="/premium-classes"
              className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-card)] px-4 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-raised)]"
            >
              Back to Premium Classes
            </Link>
          </div>
        </Card>

        <div className="mt-6 grid gap-4">
          {course.modules.map((module) => (
            <Link
              key={module.slug}
              href={`/premium-classes/${course.slug}/${module.slug}`}
              className="group block"
            >
              <Card className="rounded-[20px] p-4 sm:rounded-3xl sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                      Module {module.number}
                    </p>
                    <h2 className="mobile-safe-wrap mt-2 text-lg font-semibold leading-snug text-[var(--ink)]">
                      {module.title}
                    </h2>
                  </div>
                  <span className="inline-flex rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-medium text-[var(--ink-muted)] transition group-hover:border-[var(--accent-gold)] group-hover:text-[var(--ink)]">
                    View
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
