import Link from "next/link";
import { notFound } from "next/navigation";
import Card from "../../../../../components/shared/Card";
import PremiumModuleReader from "../../../../../components/premium/PremiumModuleReader";
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

  if (module.isLocked) {
    return (
      <section className="mobile-page-shell">
        <div className="lumen-page">
          <p className="lumen-chip">Premium Classes</p>
          <h1 className="mobile-safe-wrap lumen-page-title mt-4">
            Premium access required
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">
            Module {module.number} is part of the premium course library. Module 1 is
            available as a free preview for now.
          </p>

          <Card className="mt-6 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[var(--ink)]">{module.title}</p>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  Payment access is not enabled yet.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/premium-classes/${course.slug}/${course.modules[0].slug}`}
                  className="lumen-primary-action px-4 py-2 text-xs"
                >
                  Open preview
                </Link>
                <Link
                  href={`/premium-classes/${course.slug}`}
                  className="lumen-secondary-action"
                >
                  Back to Course
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="lumen-chip">{course.title}</span>
            <span className="lumen-chip">Module {module.number}</span>
          </div>
          <h1 className="mobile-safe-wrap mt-2 text-base font-extrabold leading-snug text-[var(--ink)] sm:text-lg">
            {module.title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {previousModule ? (
            <Link
              href={`/premium-classes/${course.slug}/${previousModule.slug}`}
              className="lumen-secondary-action px-3 py-2 text-xs"
            >
              Previous
            </Link>
          ) : null}
          {nextModule && !nextModule.isLocked ? (
            <Link
              href={`/premium-classes/${course.slug}/${nextModule.slug}`}
              className="lumen-secondary-action px-3 py-2 text-xs"
            >
              Next
            </Link>
          ) : null}
          {nextModule?.isLocked ? (
            <span className="lumen-secondary-action px-3 py-2 text-xs opacity-70">
              Next locked
            </span>
          ) : null}
          <Link
            href={`/premium-classes/${course.slug}`}
            className="lumen-secondary-action px-3 py-2 text-xs"
          >
            Back to Course
          </Link>
        </div>
      </div>
      <PremiumModuleReader title={module.title} iframeSrc={module.iframeSrc} courseSlug={course.slug} />
    </section>
  );
}
