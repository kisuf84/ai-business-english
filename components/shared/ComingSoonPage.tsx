import Link from "next/link";
import Card from "./Card";

export default function ComingSoonPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="mobile-page-shell">
      <div className="lumen-page">
        <div className="mb-7">
          <p className="lumen-chip">{eyebrow}</p>
          <h1 className="lumen-page-title mt-4">{title}</h1>
        </div>
        <Card className="max-w-2xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
            Coming soon
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">{description}</p>
          <Link href="/dashboard" className="lumen-secondary-action mt-5 inline-flex px-3 py-2 text-xs">
            Back to Dashboard
          </Link>
        </Card>
      </div>
    </section>
  );
}
