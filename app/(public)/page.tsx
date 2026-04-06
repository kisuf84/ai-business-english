import Link from "next/link";
import Button from "../../components/shared/Button";
import Card from "../../components/shared/Card";

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[var(--accent-gold-soft)] blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-[rgba(42,92,63,0.12)] blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-faint)]">
              The fastest way to learn English for work
            </p>
            <h1 className="mt-3 font-serif text-4xl font-normal text-[var(--ink)] sm:text-5xl">
              Business English training, instantly generated.
            </h1>
            <p className="mt-5 text-base text-[var(--ink-muted)]">
              Create polished lessons, courses, and workplace simulations in
              minutes. Built for professionals, teachers, and teams who need
              practical English for real work.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/lesson/new">
                <Button className="rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-6 py-3 text-xs font-semibold text-[#0c0b0a] shadow-[0_4px_12px_rgba(201,162,74,0.3)] hover:bg-[#d4ad55]">
                  Create Lesson
                </Button>
              </Link>
              <Link href="/lessons">
                <Button className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-card)] px-6 py-3 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-raised)]">
                  View Lessons
                </Button>
              </Link>
            </div>
          </div>

          <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface-card)] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                Product Preview
              </p>
              <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--ink-muted)]">
                Live MVP
              </span>
            </div>
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 text-sm text-[var(--ink-muted)]">
              <p className="font-semibold text-[var(--ink)]">
                Lesson Generator
              </p>
              <p className="mt-2">Topic: Project kickoff meeting</p>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-3/4 rounded-full bg-[var(--surface-hover)]" />
                <div className="h-2 w-2/3 rounded-full bg-[var(--surface-hover)]" />
                <div className="h-2 w-1/2 rounded-full bg-[var(--surface-hover)]" />
              </div>
              <p className="mt-4 text-xs text-[var(--ink-faint)]">
                Structured objectives, vocabulary, reading, and role-play.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <div className="flex items-center gap-2">
              <FeatureIcon />
              <h2 className="text-lg font-semibold text-[var(--ink)]">
                Lesson Generator
              </h2>
            </div>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Generate complete lessons with objectives, exercises, and quizzes
              in seconds.
            </p>
          </Card>
          <Card>
            <div className="flex items-center gap-2">
              <FeatureIcon />
              <h2 className="text-lg font-semibold text-[var(--ink)]">
                Course Generator
              </h2>
            </div>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Build structured course outlines with modules and lesson titles.
            </p>
          </Card>
          <Card>
            <div className="flex items-center gap-2">
              <FeatureIcon />
              <h2 className="text-lg font-semibold text-[var(--ink)]">
                Simulation Practice
              </h2>
            </div>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Practice meetings, negotiations, and presentations with AI
              feedback.
            </p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <Card className="grid gap-6 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
              For professionals
            </p>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Learn English tailored to your role, industry, and daily tasks.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
              For teachers
            </p>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Deliver structured lessons with speaking, grammar, and role-play
              activities.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
              For companies
            </p>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Scale training with consistent, high-quality lesson content.
            </p>
          </div>
        </Card>
      </section>
    </main>
  );
}

function FeatureIcon() {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--accent-gold-soft)] text-[var(--accent-gold)]">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2v20" />
        <path d="M2 12h20" />
      </svg>
    </span>
  );
}
