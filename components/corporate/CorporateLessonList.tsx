import Link from "next/link";
import Card from "../shared/Card";

export type CorporateLessonListItem = {
  slug: string;
  title: string;
  number: number | null;
  href: string;
};

/** Ordered lesson/module list for one Corporate category (≤ 30 entries). */
export default function CorporateLessonList({
  items,
  lessonNoun,
}: {
  items: CorporateLessonListItem[];
  lessonNoun: string;
}) {
  const label = lessonNoun.charAt(0).toUpperCase() + lessonNoun.slice(1);

  return (
    <ol className="grid gap-3 md:grid-cols-2">
      {items.map((item) => {
        // Never invent a number the source doesn't provide.
        const heading = item.number !== null ? `${label} ${item.number}` : label;
        return (
          <li key={item.slug}>
            <Link href={item.href} className="group block" aria-label={`${heading}: ${item.title}`}>
              <Card className="lumen-card-link h-full">
                <div className="flex items-center gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--glass)] font-mono text-sm font-bold text-[var(--ink)]">
                    {item.number ?? "•"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                      {heading}
                    </p>
                    <h2 className="mobile-safe-wrap mt-0.5 text-sm font-semibold leading-snug text-[var(--ink)] sm:text-base">
                      {item.title}
                    </h2>
                  </div>
                  <span aria-hidden="true" className="shrink-0 text-[var(--ink-faint)] transition group-hover:text-[var(--ink)]">
                    →
                  </span>
                </div>
              </Card>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
