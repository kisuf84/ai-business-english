import Link from "next/link";
import { notFound } from "next/navigation";
import Card from "../../../../components/shared/Card";
import PremiumModuleList from "../../../../components/premium/PremiumModuleList";
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
    <section className="mobile-page-shell">
      <div className="lumen-page">
        <div className="mb-6 sm:mb-8">
          <p className="lumen-chip">
            Premium Classes
          </p>
          <h1 className="lumen-page-title mt-4">
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
                Module 1 is available as a preview. Other modules require premium access.
              </p>
            </div>
            <Link
              href="/premium-classes"
              className="lumen-secondary-action"
            >
              Back to Premium Classes
            </Link>
          </div>
        </Card>

        <PremiumModuleList course={course} />
      </div>
    </section>
  );
}
