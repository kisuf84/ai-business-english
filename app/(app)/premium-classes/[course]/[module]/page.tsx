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
    <section className="mobile-page-shell py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 sm:mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Premium Classes
          </p>
          <h1 className="mobile-safe-wrap mt-2 text-balance font-serif text-3xl font-normal text-[var(--ink)]">
            {module.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-muted)]">
            {course.title} · Module {module.number} of {course.moduleCount}
          </p>
        </div>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
                {course.title}
              </span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
                Module {module.number}
              </span>
            </div>
            <Link
              href={`/premium-classes/${course.slug}`}
              className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-card)] px-4 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-raised)]"
            >
              Back to Course
            </Link>
          </div>
        </Card>

        <Card className="mt-6 overflow-hidden rounded-[20px] p-2 sm:rounded-3xl sm:p-4">
          <div className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-white">
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
              className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-card)] px-4 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-raised)]"
            >
              Previous: Module {previousModule.number}
            </Link>
          ) : (
            <div />
          )}

          {nextModule ? (
            <Link
              href={`/premium-classes/${course.slug}/${nextModule.slug}`}
              className="inline-flex rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-4 py-2 text-xs font-semibold text-[#0c0b0a] transition hover:bg-[#d4ad55]"
            >
              Next: Module {nextModule.number}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
