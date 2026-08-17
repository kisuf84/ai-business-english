import Link from "next/link";

export default function CatalogPageShell({
  eyebrow,
  title,
  description,
  backLink,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  backLink?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="mobile-page-shell py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[1200px]">
        {backLink ? (
          <p className="text-xs text-[var(--ink-muted)]">
            <Link href={backLink.href} className="hover:text-[var(--ink)]">
              ← {backLink.label}
            </Link>
          </p>
        ) : null}
        <div className={backLink ? "mt-3 mb-6 sm:mb-8" : "mb-6 sm:mb-8"}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">{title}</h1>
          {description ? (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">{description}</p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}
