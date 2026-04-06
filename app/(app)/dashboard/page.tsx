export const dynamic = "force-dynamic";

import Link from "next/link";
import Card from "../../../components/shared/Card";
import Button from "../../../components/shared/Button";
import { listLessons } from "../../../lib/data/lessons";
import { listCourses } from "../../../lib/data/courses";

async function loadDashboardData() {
  try {
    const [lessons, courses] = await Promise.all([listLessons(), listCourses()]);
    return {
      lessons: Array.isArray(lessons) ? lessons : [],
      courses: Array.isArray(courses) ? courses : [],
    };
  } catch (error) {
    console.error("Dashboard data load failed:", error);
    return {
      lessons: [],
      courses: [],
    };
  }
}

export default async function DashboardPage() {
  const { lessons, courses } = await loadDashboardData();
  const recentLessons = lessons.slice(0, 3);
  const totalItems = lessons.length + courses.length;
  const lessonFill = totalItems === 0 ? 18 : Math.max(18, Math.round((lessons.length / totalItems) * 100));
  const courseFill = totalItems === 0 ? 16 : Math.max(16, Math.round((courses.length / totalItems) * 100));
  const statCards = [
    {
      label: "Lessons",
      icon: "L",
      tone: "bg-[rgba(79,108,245,0.2)] text-[#5b7cff]",
      chip: "Generator",
      value: lessons.length,
      copy: "Structured lessons created",
    },
    {
      label: "Courses",
      icon: "C",
      tone: "bg-[rgba(34,197,229,0.18)] text-[#28c3eb]",
      chip: "Courses",
      value: courses.length,
      copy: "Generated course drafts",
    },
    {
      label: "Library",
      icon: "R",
      tone: "bg-[rgba(25,184,122,0.16)] text-[#1ec584]",
      chip: "Recent",
      value: recentLessons.length,
      copy: "Recent lessons pinned",
    },
    {
      label: "Workspace",
      icon: "W",
      tone: "bg-[rgba(215,155,49,0.18)] text-[#e3a93b]",
      chip: "Content",
      value: totalItems,
      copy: "Active items in progress",
    },
  ];

  return (
    <section
      className="font-ui mx-auto max-w-[1400px]"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <div className="mb-[26px] flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
        <div>
          <h1 className="m-0 text-[36px] font-extrabold tracking-[-0.035em] text-[var(--ink)]">
            Good morning, Alex
          </h1>
          <p className="mt-[10px] max-w-[760px] text-base leading-[1.6] text-[var(--ink-muted)]">
            Here's your performance overview and learning progress across the current lesson and course workspace.
          </p>
        </div>
        <div className="flex min-w-[210px] items-center gap-3 self-start rounded-[18px] border border-[var(--border)] bg-white/[0.03] px-[18px] py-[14px] xl:self-center">
          <div className="relative h-5 w-5 rounded-[50%_50%_55%_45%] border-2 border-[#d79b31] rotate-[10deg] before:absolute before:inset-1 before:rounded-[50%_50%_55%_45%] before:border-2 before:border-[#d79b31] before:content-['']" />
          <div>
            <strong className="block text-base font-semibold text-[var(--ink)]">
              5 day streak
            </strong>
            <span className="text-sm text-[var(--ink-muted)]">Keep it up!</span>
          </div>
        </div>
      </div>

      <section className="mb-[26px] grid gap-[18px] md:grid-cols-2 2xl:grid-cols-4">
        {statCards.map((card) => (
          <Card
            key={card.label}
            className="min-h-[160px] rounded-[18px] border border-[var(--border)] bg-[var(--surface-card)] p-[22px] shadow-sm"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div
                className={`grid h-[50px] w-[50px] place-items-center rounded-[14px] text-lg font-bold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] ${card.tone}`}
              >
                {card.icon}
              </div>
              <div className="rounded-full bg-white/[0.06] px-[14px] py-2 text-sm font-semibold text-[var(--ink-muted)]">
                {card.chip}
              </div>
            </div>
            <div className="text-[52px] font-extrabold leading-none tracking-[-0.04em] text-[var(--ink)]">
              {card.value}
            </div>
            <div className="mt-[10px] text-base leading-[1.5] text-[var(--ink-muted)]">
              {card.copy}
            </div>
          </Card>
        ))}
      </section>

      <section className="mb-6 grid items-start gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(320px,1fr)]">
        <Card className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-card)] p-7 shadow-sm">
          <h2 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-[var(--ink)]">
            Workspace Content History
          </h2>
          <div className="mb-[22px] mt-2 text-[15px] text-[var(--ink-muted)]">
            Your lesson and course generation progress over time.
          </div>

          <div className="grid min-h-[380px] gap-4 lg:grid-cols-[1fr_auto]">
            <div className="flex flex-col gap-[18px]">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">
                  B2
                </div>
                <div className="flex items-center gap-3 text-base text-[var(--ink-muted)]">
                  <span>Current CEFR level</span>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span
                        key={index}
                        className={`block h-[10px] w-7 rounded-full ${
                          index < 4 ? "bg-[var(--accent)]" : "bg-white/[0.08]"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-1 grid gap-4 lg:grid-cols-[92px_1fr] lg:items-center">
                <div className="text-sm leading-[1.5] text-[var(--ink-muted)]">
                  Lessons
                  <br />
                  in library
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/[0.08]">
                  <span
                    className="block h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${lessonFill}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[92px_1fr] lg:items-center">
                <div className="text-sm leading-[1.5] text-[var(--ink-muted)]">
                  Courses
                  <br />
                  in drafts
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/[0.08]">
                  <span
                    className="block h-full rounded-full bg-[#22c5e5]"
                    style={{ width: `${courseFill}%` }}
                  />
                </div>
              </div>

              <div className="mt-2 rounded-[18px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
                <p className="text-sm font-semibold text-[var(--ink)]">Recent lesson activity</p>
                <div className="mt-3 space-y-3">
                  {recentLessons.length === 0 ? (
                    <p className="text-sm text-[var(--ink-muted)]">
                      No lessons generated yet. Create a lesson to start populating this dashboard.
                    </p>
                  ) : (
                    recentLessons.map((lesson, index) => (
                      <Link
                        key={lesson.id}
                        href={`/lessons/${lesson.id}`}
                        className="flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.06]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--ink)]">
                            {lesson.title}
                          </p>
                          <p className="mt-1 text-xs text-[var(--ink-muted)]">
                            Recent lesson {index + 1}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                          Open
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="text-right text-[15px] text-[var(--ink-muted)]">
              <div>Overall items</div>
              <div className="mt-[106px] text-[28px] text-[var(--ink-muted)]">
                {totalItems}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-[22px]">
          <Card className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-card)] p-7 shadow-sm">
            <div className="mb-[18px] flex items-center justify-between gap-3">
              <h2 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-[var(--ink)]">
                Your Profile
              </h2>
              <button className="rounded-full border border-[var(--border)] bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-[var(--ink-muted)]">
                Preferences
              </button>
            </div>

            <div className="mb-7 flex items-center gap-[14px]">
              <div className="h-[58px] w-[58px] shrink-0 rounded-full border-[3px] border-white/[0.08] bg-[linear-gradient(135deg,#2d66ff,#86a0ff)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">Alex Morgan</p>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">Product Manager</p>
                <div className="mt-2 h-2 w-7 rounded-full bg-[var(--accent)]" />
              </div>
            </div>

            <div className="mb-[10px] text-[15px] font-bold text-[var(--ink)]">
              Industry
            </div>
            <div className="mb-[18px] rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-[14px] text-[15px] text-[var(--ink-muted)]">
              Tech
            </div>

            <div className="mb-[10px] text-[15px] font-bold text-[var(--ink)]">
              CEFR Level
            </div>
            <div className="mb-[18px] rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-[14px] text-[15px] text-[var(--ink-muted)]">
              B2
            </div>

            <Button className="w-full rounded-xl border-0 bg-[var(--accent)] px-4 py-4 text-base font-bold text-white hover:bg-[#5a78ff]">
              Edit preferences
            </Button>
          </Card>

          <Card className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-card)] p-7 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ink-faint)]">
                  Workspace notes
                </p>
                <p className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  Team management is still pending
                </p>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  This panel preserves the reference structure while staying mapped to the current MVP scope.
                </p>
              </div>
              <span className="inline-flex w-fit rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Soon
              </span>
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-2">
        <div className="mb-[18px] flex items-end justify-between gap-4">
          <h3 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-[var(--ink)]">
            Quick Launch
          </h3>
          <div className="text-right text-[15px] text-[var(--ink-muted)]">
            Jump into a workspace tool
          </div>
        </div>

        <div className="grid gap-[18px] md:grid-cols-2 2xl:grid-cols-4">
          <Link href="/simulation" className="block">
            <Card className="min-h-[180px] rounded-[18px] border border-[var(--border)] bg-[var(--surface-card)] p-[22px] shadow-sm">
              <div className="grid h-[50px] w-[50px] place-items-center rounded-[14px] bg-[rgba(79,108,245,0.2)] text-lg font-bold text-[#5b7cff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                A
              </div>
              <div className="mt-[18px] text-[18px] font-bold text-[var(--ink)]">
                AI Simulation
              </div>
              <div className="mt-[10px] text-[15px] leading-[1.55] text-[var(--ink-muted)]">
                Run a guided communication simulation with structured feedback.
              </div>
            </Card>
          </Link>

          <Link href="/lesson/new" className="block">
            <Card className="min-h-[180px] rounded-[18px] border border-[var(--border)] bg-[var(--surface-card)] p-[22px] shadow-sm">
              <div className="grid h-[50px] w-[50px] place-items-center rounded-[14px] bg-[rgba(34,197,229,0.18)] text-lg font-bold text-[#28c3eb] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                L
              </div>
              <div className="mt-[18px] text-[18px] font-bold text-[var(--ink)]">
                Lesson Generator
              </div>
              <div className="mt-[10px] text-[15px] leading-[1.55] text-[var(--ink-muted)]">
                Build structured business English lessons from a single prompt flow.
              </div>
            </Card>
          </Link>

          <Link href="/courses" className="block">
            <Card className="min-h-[180px] rounded-[18px] border border-[var(--border)] bg-[var(--surface-card)] p-[22px] shadow-sm">
              <div className="grid h-[50px] w-[50px] place-items-center rounded-[14px] bg-[rgba(25,184,122,0.16)] text-lg font-bold text-[#1ec584] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                C
              </div>
              <div className="mt-[18px] text-[18px] font-bold text-[var(--ink)]">
                Course Generator
              </div>
              <div className="mt-[10px] text-[15px] leading-[1.55] text-[var(--ink-muted)]">
                Assemble structured learning paths based on professional goals.
              </div>
            </Card>
          </Link>

          <Link href="/library" className="block">
            <Card className="min-h-[180px] rounded-[18px] border border-[var(--border)] bg-[var(--surface-card)] p-[22px] shadow-sm">
              <div className="grid h-[50px] w-[50px] place-items-center rounded-[14px] bg-[rgba(215,155,49,0.18)] text-lg font-bold text-[#e3a93b] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                R
              </div>
              <div className="mt-[18px] text-[18px] font-bold text-[var(--ink)]">
                Lesson Library
              </div>
              <div className="mt-[10px] text-[15px] leading-[1.55] text-[var(--ink-muted)]">
                Reopen saved material and keep generated lessons organized in one place.
              </div>
            </Card>
          </Link>
        </div>
      </section>
    </section>
  );
}
