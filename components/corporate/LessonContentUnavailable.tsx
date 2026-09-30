import Link from "next/link";
import Card from "../shared/Card";

/**
 * Shown on an external-content lesson route when no content origin is
 * configured (LANGSLATE_CONTENT_BASE_URL unset). Deliberately explicit: the
 * lesson is not served from anywhere else, so never imply it loaded.
 */
export default function LessonContentUnavailable({
  eyebrow,
  title,
  backLink,
}: {
  eyebrow: string;
  title: string;
  backLink: { href: string; label: string };
}) {
  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-y-auto">
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-3 sm:px-5">
        <span className="lumen-chip">{eyebrow}</span>
        <h1 className="mobile-safe-wrap mt-2 text-base font-extrabold leading-snug text-[var(--ink)] sm:text-lg">
          {title}
        </h1>
      </div>
      <div className="grid flex-1 place-items-center p-4 sm:p-8">
        <Card className="max-w-lg p-6 text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
            Lesson not available yet
          </p>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            This lesson&rsquo;s content hasn&rsquo;t been published to this environment yet. Please check back later.
          </p>
          <Link href={backLink.href} className="lumen-secondary-action mt-5 inline-flex px-4 py-2 text-xs font-semibold">
            ← {backLink.label}
          </Link>
        </Card>
      </div>
    </section>
  );
}
