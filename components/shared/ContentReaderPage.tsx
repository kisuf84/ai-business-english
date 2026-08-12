import Link from "next/link";
import EnglishTrainingLessonReader from "../englishTraining/EnglishTrainingLessonReader";

export type ContentReaderBackLink = {
  href: string;
  label: string;
};

export default function ContentReaderPage({
  eyebrow,
  title,
  iframeSrc,
  backLinks,
}: {
  eyebrow: string;
  title: string;
  iframeSrc: string;
  backLinks: ContentReaderBackLink[];
}) {
  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="lumen-chip">{eyebrow}</span>
          </div>
          <h1 className="mobile-safe-wrap mt-2 text-base font-extrabold leading-snug text-[var(--ink)] sm:text-lg">
            {title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {backLinks.map((link) => (
            <Link key={link.href} href={link.href} className="lumen-secondary-action px-3 py-2 text-xs">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <EnglishTrainingLessonReader title={title} iframeSrc={iframeSrc} />
    </section>
  );
}
