export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import Card from "../../../components/shared/Card";
import PersonalizedGreeting from "../../../components/shared/PersonalizedGreeting";
import { listLessons } from "../../../lib/data/lessons";
import { listActivePremiumCourses } from "../../../lib/premiumClasses";
import { getRequestAuthUser } from "../../../lib/supabase/auth";

async function loadDashboardData() {
  try {
    const cookieStore = cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    const authRequest = new Request("http://localhost/dashboard", {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
    const authUser = await getRequestAuthUser(authRequest);
    const [lessons, premiumCourses] = await Promise.all([
      listLessons(authUser?.id),
      listActivePremiumCourses(),
    ]);
    return {
      lessons: Array.isArray(lessons) ? lessons : [],
      premiumCourses: Array.isArray(premiumCourses) ? premiumCourses : [],
    };
  } catch (error) {
    console.error("Dashboard data load failed:", error);
    return {
      lessons: [],
      premiumCourses: [],
    };
  }
}

export default async function DashboardPage() {
  const { lessons, premiumCourses } = await loadDashboardData();
  const recentLessons = lessons.slice(0, 3);
  const statCards = [
    {
      label: "Lessons",
      icon: "LE",
      tone: "bg-[image:var(--grad-aurora)] text-[#0a0a14]",
      chip: "Generator",
      value: lessons.length,
      copy: "Lessons created",
    },
    {
      label: "Premium courses",
      icon: "PC",
      tone: "bg-[image:var(--grad-aurora)] text-[#0a0a14]",
      chip: "Premium",
      value: premiumCourses.length,
      copy: "Premium courses available",
    },
  ];

  return (
    <section
      className="mobile-page-shell font-ui mx-auto max-w-[1400px]"
    >
      <div className="hero mb-6">
        <div>
          <p className="kicker mb-4">Dashboard</p>
          <PersonalizedGreeting />
          <p className="hero-sub mt-2">
            Manage generated lessons, simulations, premium course access, and teaching resources.
          </p>
          <div className="hero-actions">
            <Link href="/lesson/new" className="btn btn-aurora lumen-focus">
              Create lesson
            </Link>
            <Link href="/simulation" className="btn btn-ghost lumen-focus">
              Start simulation
            </Link>
          </div>
        </div>
        <div className="hero-side grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {statCards.map((card) => (
            <div key={card.label} className="stat-tile">
              <div className={`icon font-mono text-[10px] font-bold ${card.tone}`}>
                {card.icon}
              </div>
              <div className="v">{card.value}</div>
              <div className="l">{card.copy}</div>
              <span className="delta">{card.chip}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5 sm:p-7">
          <h2 className="lumen-heading m-0 text-[26px]">
            Recent lesson activity
          </h2>
          <p className="mb-4 mt-2 text-sm text-[var(--ink-muted)] sm:mb-[22px] sm:text-[15px]">
            Saved lessons from your real lesson library.
          </p>
          <div className="space-y-3">
            {recentLessons.length === 0 ? (
              <p className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)] p-4 text-sm text-[var(--ink-muted)]">
                No lessons generated yet. Create a lesson to start populating this dashboard.
              </p>
            ) : (
              recentLessons.map((lesson, index) => (
                <Link
                  key={lesson.id}
                  href={`/lessons/${lesson.id}`}
                  className="lesson-card flex items-center justify-between gap-3 px-3 py-3 sm:px-4"
                >
                  <div className="min-w-0">
                    <p className="mobile-safe-wrap text-sm font-semibold text-[var(--ink)]">
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
        </Card>

        <Card className="p-5 sm:p-7">
          <h2 className="lumen-heading m-0 text-[26px]">Workspace status</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
            Langslate is ready for lesson generation, simulation practice, and resource access.
          </p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)] p-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                CEFR level
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                Set per lesson or simulation
              </p>
            </div>
            <div className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)] p-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                Library
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                {lessons.length} saved lesson{lessons.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-2">
        <div className="mb-[18px] flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end sm:gap-3">
          <h3 className="lumen-heading m-0 text-[28px]">
            Quick Launch
          </h3>
          <div className="text-left text-sm text-[var(--ink-muted)] sm:text-right sm:text-[15px]">
            Jump into a workspace tool
          </div>
        </div>

        <div className="grid gap-3 sm:gap-[18px] md:grid-cols-2 xl:grid-cols-4">
          <Link href="/lesson/new" className="block">
            <Card className="lesson-card min-h-[170px] p-5 sm:min-h-[190px] sm:p-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--grad-aurora)] font-mono text-xs font-bold text-[#0a0a14] shadow-glow">
                LE
              </div>
              <div className="mt-4 text-[17px] font-bold text-[var(--ink)] sm:mt-[18px] sm:text-[18px]">
                Create lesson
              </div>
              <div className="mt-2 text-sm leading-[1.55] text-[var(--ink-muted)] sm:mt-[10px] sm:text-[15px]">
                Build structured business English lessons from a topic, URL, or transcript.
              </div>
            </Card>
          </Link>

          <Link href="/simulation" className="block">
            <Card className="lesson-card min-h-[170px] p-5 sm:min-h-[190px] sm:p-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--grad-aurora)] font-mono text-xs font-bold text-[#0a0a14] shadow-glow">
                SI
              </div>
              <div className="mt-4 text-[17px] font-bold text-[var(--ink)] sm:mt-[18px] sm:text-[18px]">
                Start simulation
              </div>
              <div className="mt-2 text-sm leading-[1.55] text-[var(--ink-muted)] sm:mt-[10px] sm:text-[15px]">
                Practice workplace communication with guided AI feedback.
              </div>
            </Card>
          </Link>

          <Link href="/lessons" className="block">
            <Card className="lesson-card min-h-[170px] p-5 sm:min-h-[190px] sm:p-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--grad-aurora)] font-mono text-xs font-bold text-[#0a0a14] shadow-glow">
                LI
              </div>
              <div className="mt-4 text-[17px] font-bold text-[var(--ink)] sm:mt-[18px] sm:text-[18px]">
                View library
              </div>
              <div className="mt-2 text-sm leading-[1.55] text-[var(--ink-muted)] sm:mt-[10px] sm:text-[15px]">
                Reopen saved material and keep generated lessons organized in one place.
              </div>
            </Card>
          </Link>

          <Link href="/for-teachers" className="block">
            <Card className="lesson-card min-h-[170px] p-5 sm:min-h-[190px] sm:p-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--grad-aurora)] font-mono text-xs font-bold text-[#0a0a14] shadow-glow">
                FT
              </div>
              <div className="mt-4 text-[17px] font-bold text-[var(--ink)] sm:mt-[18px] sm:text-[18px]">
                Teacher resources
              </div>
              <div className="mt-2 text-sm leading-[1.55] text-[var(--ink-muted)] sm:mt-[10px] sm:text-[15px]">
                Access resources prepared for teaching and classroom workflows.
              </div>
            </Card>
          </Link>
        </div>
      </section>
    </section>
  );
}
