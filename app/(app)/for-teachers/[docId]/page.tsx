import Link from "next/link";
import { notFound } from "next/navigation";
import Card from "../../../../components/shared/Card";
import { getTeacherResourceById } from "../../../../lib/forTeachersResources";

export default function TeacherLessonViewerPage({
  params,
}: {
  params: { docId: string };
}) {
  const resource = getTeacherResourceById(params.docId);
  if (!resource) {
    notFound();
  }

  return (
    <section className="py-10">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-xs text-[var(--ink-muted)]">
          <Link href="/for-teachers" className="hover:text-[var(--ink)]">
            ← Back to For Teachers
          </Link>
        </p>

        <div className="mt-3 mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Teacher Resources
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            {resource.title}
          </h1>
        </div>

        <Card className="overflow-hidden rounded-3xl p-3 sm:p-5">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]">
            <iframe
              src={resource.embedUrl}
              title={`${resource.title} lesson`}
              style={{ width: "100%", height: "min(86vh, 980px)", minHeight: "60vh", border: "none" }}
              allow="fullscreen"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>

          <div className="mt-4">
            <Link
              href={resource.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--accent-gold)] sm:w-auto"
            >
              Open in Gamma
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
