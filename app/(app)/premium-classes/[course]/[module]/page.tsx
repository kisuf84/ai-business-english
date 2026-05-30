import Link from "next/link";
import { notFound } from "next/navigation";
import Card from "../../../../../components/shared/Card";
import { getPremiumModule, listPremiumCourses } from "../../../../../lib/premiumClasses";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const courses = await listPremiumCourses();

  return courses.flatMap((course) =>
    course.modules.map((module) => ({
      course: course.slug,
      module: module.slug,
    }))
  );
}

type PremiumModulePageProps = {
  params: { course: string; module: string };
};

export default async function PremiumModulePage({ params }: PremiumModulePageProps) {
  const entry = await getPremiumModule(params.course, params.module);

  if (!entry) {
    notFound();
  }

  const { course, module, currentIndex } = entry;
  const previousModule = currentIndex > 0 ? course.modules[currentIndex - 1] : null;
  const nextModule =
    currentIndex < course.modules.length - 1 ? course.modules[currentIndex + 1] : null;

  return (
    <section className="mobile-page-shell">
      <div className="lumen-page-wide">
        <div className="mb-6 sm:mb-8">
          <p className="lumen-chip">
            Premium Classes
          </p>
          <h1 className="mobile-safe-wrap lumen-page-title mt-4">
            {module.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-muted)]">
            {course.title} · Module {module.number} of {course.moduleCount}
          </p>
        </div>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="lumen-chip">
                {course.title}
              </span>
              <span className="lumen-chip">
                Module {module.number}
              </span>
            </div>
            <Link
              href={`/premium-classes/${course.slug}`}
              className="lumen-secondary-action"
            >
              Back to Course
            </Link>
          </div>
        </Card>

        <Card className="mt-6 overflow-hidden p-2 sm:p-4">
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-white">
            <iframe
              title={module.title}
              src={module.iframeSrc}
              className="h-[68vh] min-h-[360px] w-full border-0 sm:h-[80vh] sm:min-h-[720px]"
            />
          </div>
        </Card>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {previousModule ? (
            <Link
              href={`/premium-classes/${course.slug}/${previousModule.slug}`}
              className="lumen-secondary-action"
            >
              Previous: Module {previousModule.number}
            </Link>
          ) : (
            <div />
          )}

          {nextModule ? (
            <Link
              href={`/premium-classes/${course.slug}/${nextModule.slug}`}
              className="lumen-primary-action px-4 py-2 text-xs"
            >
              Next: Module {nextModule.number}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
