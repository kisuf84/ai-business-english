"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import "./corporatePlatform.css";

export type CorporatePlatformLesson = {
  id: number;
  slug: string;
  title: string;
  number: number | null;
  href: string;
  contentUrl: string | null;
};

export type CorporatePlatformCategory = {
  slug: string;
  label: string;
  href: string;
  thumbnailSrc: string;
  lessons: CorporatePlatformLesson[];
};

export type CorporatePlatformFamily = {
  slug: "professions" | "industries" | "departments" | "pro";
  label: string;
  href: string;
  categories: CorporatePlatformCategory[];
};

type CorporatePlatformProps = {
  families: CorporatePlatformFamily[];
};

type Route = "dashboard" | "courses" | "progress" | "achievements" | "settings";
type Theme = "dark" | "light";

type PlatformState = {
  user: { name: string; avatarId: string };
  xp: number;
  xpToday: number;
  streak: number;
  lastActive: string | null;
  completed: Record<string, number>;
  dailyGoal: number;
  dailyDone: number;
  goalDate: string | null;
  theme: Theme;
  heatmap: Record<string, number>;
  totalTime: number;
};

const STATE_KEY = "lc_state_v2";

const FAMILY_META: Record<
  CorporatePlatformFamily["slug"],
  { label: string; color: string; bg: string; icon: string; desc: string }
> = {
  professions: {
    label: "Professions",
    color: "#3b82f6",
    bg: "rgba(59,130,246,.12)",
    icon: "briefcase",
    desc: "Role-specific English for every job title, from entry-level to the C-suite.",
  },
  industries: {
    label: "Industries",
    color: "#f59e0b",
    bg: "rgba(245,158,11,.12)",
    icon: "industry",
    desc: "Sector vocabulary and real scenarios across 60 global industries.",
  },
  departments: {
    label: "Departments",
    color: "#10b981",
    bg: "rgba(16,185,129,.12)",
    icon: "building",
    desc: "Cross-functional English for every team inside a modern company.",
  },
  pro: {
    label: "Langslate Pro",
    color: "#f43f5e",
    bg: "rgba(244,63,94,.12)",
    icon: "crown",
    desc: "Elite executive programs for leadership, negotiation, and the boardroom.",
  },
};

const AVATARS = [
  { id: "m1", emoji: "👨‍💼", label: "Man 1" },
  { id: "m2", emoji: "👨‍🎓", label: "Man 2" },
  { id: "m3", emoji: "👨‍💻", label: "Man 3" },
  { id: "m4", emoji: "🧔", label: "Man 4" },
  { id: "m5", emoji: "👨‍🏫", label: "Man 5" },
  { id: "f1", emoji: "👩‍💼", label: "Woman 1" },
  { id: "f2", emoji: "👩‍🎓", label: "Woman 2" },
  { id: "f3", emoji: "👩‍💻", label: "Woman 3" },
  { id: "f4", emoji: "👩‍🏫", label: "Woman 4" },
  { id: "f5", emoji: "👩‍🎤", label: "Woman 5" },
];

function dateKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split("T")[0];
}

function defaultState(): PlatformState {
  return {
    user: { name: "Learner", avatarId: "m1" },
    xp: 0,
    xpToday: 0,
    streak: 0,
    lastActive: null,
    completed: {},
    dailyGoal: 3,
    dailyDone: 0,
    goalDate: null,
    theme: "dark",
    heatmap: {},
    totalTime: 0,
  };
}

function loadState(): PlatformState {
  if (typeof window === "undefined") return defaultState();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STATE_KEY) || "null") as Partial<PlatformState> | null;
    return parsed ? { ...defaultState(), ...parsed, user: { ...defaultState().user, ...parsed.user } } : defaultState();
  } catch {
    return defaultState();
  }
}

function lessonKey(lesson: CorporatePlatformLesson) {
  return lesson.href;
}

function icon(name: string) {
  return <i className={`fas fa-${name}`} aria-hidden="true" />;
}

export default function CorporatePlatform({ families }: CorporatePlatformProps) {
  const [state, setState] = useState<PlatformState>(() => defaultState());
  const [route, setRoute] = useState<Route>("dashboard");
  const [activeFamilySlug, setActiveFamilySlug] = useState<CorporatePlatformFamily["slug"] | null>(null);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [viewerLesson, setViewerLesson] = useState<CorporatePlatformLesson | null>(null);
  const [viewerListCollapsed, setViewerListCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  const lessons = useMemo(() => families.flatMap((family) => family.categories.flatMap((category) => category.lessons)), [families]);
  const categories = useMemo(() => families.flatMap((family) => family.categories.map((category) => ({ ...category, family }))), [families]);
  const completedCount = Object.keys(state.completed).length;
  const totalLessons = lessons.length;
  const totalCategories = categories.length;
  const activeFamily = families.find((family) => family.slug === activeFamilySlug) ?? null;
  const activeCategory = activeFamily?.categories.find((category) => category.slug === activeCategorySlug) ?? null;
  const currentAvatar = AVATARS.find((avatar) => avatar.id === state.user.avatarId) ?? AVATARS[0];
  const nextLesson = lessons.find((lesson) => !state.completed[lessonKey(lesson)]) ?? lessons[0];

  useEffect(() => {
    const loaded = loadState();
    const today = dateKey();
    const yesterday = dateKey(-1);
    const next = { ...loaded };
    if (next.lastActive !== today) {
      next.streak = next.lastActive === yesterday ? (next.streak || 0) + 1 : next.lastActive ? 0 : next.streak;
      next.lastActive = today;
    }
    if (next.goalDate !== today) {
      next.dailyDone = 0;
      next.goalDate = today;
      next.xpToday = 0;
    }
    setState(next);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-corporate-theme", state.theme);
    try {
      window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace("#", "") || "dashboard";
      const [rawRoute, rawFamily, rawCategory, rawLesson] = hash.split("/");
      if (rawRoute === "lesson" && rawLesson) {
        const found = lessons.find((lesson) => lesson.id === Number(rawLesson));
        if (found) setViewerLesson(found);
        return;
      }
      const nextRoute = ["dashboard", "courses", "progress", "achievements", "settings"].includes(rawRoute)
        ? (rawRoute as Route)
        : "dashboard";
      setRoute(nextRoute);
      setActiveFamilySlug((rawFamily as CorporatePlatformFamily["slug"]) || null);
      setActiveCategorySlug(rawCategory || null);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [lessons]);

  useEffect(() => {
    document.body.style.overflow = viewerLesson ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [viewerLesson]);

  const saveState = (updater: (current: PlatformState) => PlatformState) => setState((current) => updater(current));

  const nav = (nextRoute: Route, familySlug?: CorporatePlatformFamily["slug"] | null, categorySlug?: string | null) => {
    setRoute(nextRoute);
    setActiveFamilySlug(familySlug ?? null);
    setActiveCategorySlug(categorySlug ?? null);
    setSidebarOpen(false);
    setViewerLesson(null);
    const hash = categorySlug ? `#${nextRoute}/${familySlug}/${categorySlug}` : familySlug ? `#${nextRoute}/${familySlug}` : `#${nextRoute}`;
    window.history.replaceState(null, "", hash);
  };

  const openViewer = (lesson: CorporatePlatformLesson, familySlug: CorporatePlatformFamily["slug"], categorySlug: string) => {
    setActiveFamilySlug(familySlug);
    setActiveCategorySlug(categorySlug);
    setViewerLesson(lesson);
    setViewerListCollapsed(false);
    setFocusMode(false);
    window.history.replaceState(null, "", `#lesson/${familySlug}/${categorySlug}/${lesson.id}`);
  };

  const closeViewer = () => {
    setViewerLesson(null);
    setFocusMode(false);
    setViewerListCollapsed(false);
    const hash = activeFamilySlug && activeCategorySlug ? `#courses/${activeFamilySlug}/${activeCategorySlug}` : "#courses";
    window.history.replaceState(null, "", hash);
  };

  const toast = (msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((items) => [...items, { id, msg }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3200);
  };

  const markDone = () => {
    if (!viewerLesson) return;
    const key = lessonKey(viewerLesson);
    if (state.completed[key]) {
      toast("Already completed!");
      return;
    }
    saveState((current) => ({
      ...current,
      completed: { ...current.completed, [key]: Date.now() },
      xp: current.xp + 15,
      xpToday: current.xpToday + 15,
      dailyDone: current.dailyDone + 1,
      totalTime: current.totalTime + 15,
      heatmap: { ...current.heatmap, [dateKey()]: (current.heatmap[dateKey()] || 0) + 1 },
    }));
    toast(`+15 XP - ${viewerLesson.title}`);
  };

  const searchResults = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];
    return lessons
      .map((lesson) => {
        const category = categories.find((item) => item.lessons.some((candidate) => candidate.href === lesson.href));
        return category ? { lesson, category } : null;
      })
      .filter((item): item is { lesson: CorporatePlatformLesson; category: CorporatePlatformCategory & { family: CorporatePlatformFamily } } =>
        Boolean(item && `${item.lesson.title} ${item.category.label} ${item.category.family.label}`.toLowerCase().includes(clean))
      )
      .slice(0, 10);
  }, [categories, lessons, query]);

  const doneForFamily = (family: CorporatePlatformFamily) =>
    family.categories.reduce(
      (sum, category) => sum + category.lessons.filter((lesson) => state.completed[lessonKey(lesson)]).length,
      0
    );
  const doneForCategory = (category: CorporatePlatformCategory) =>
    category.lessons.filter((lesson) => state.completed[lessonKey(lesson)]).length;

  return (
    <div className="corporate-platform">
      <div className={sidebarOpen ? "corporate-overlay show" : "corporate-overlay"} onClick={() => setSidebarOpen(false)} />
      <div className="corporate-app">
        <aside className={sidebarOpen ? "corporate-sidebar open" : "corporate-sidebar"}>
          <button className="corporate-logo" onClick={() => nav("dashboard")} type="button">
            <img src="/corporate-platform/logo.png" alt="Langslate" className="corporate-logo-img" />
            <span>
              <span className="corporate-logo-text">Langslate</span>
              <span className="corporate-logo-sub">CORPORATE</span>
            </span>
          </button>
          <div className="corporate-user">
            <span className="corporate-avatar">{currentAvatar.emoji}</span>
            <span>
              <span className="corporate-user-name">{state.user.name}</span>
              <span className="corporate-user-streak">{state.streak} day streak</span>
            </span>
          </div>
          <div className="corporate-xp-wrap">
            <div className="corporate-xp-row">
              <span>Daily XP</span>
              <span>{state.xpToday} / 100</span>
            </div>
            <div className="corporate-xp-bar">
              <div style={{ width: `${Math.min(100, state.xpToday)}%` }} />
            </div>
          </div>
          <div className="corporate-section">Menu</div>
          <SideButton active={route === "dashboard"} iconName="home" label="Dashboard" onClick={() => nav("dashboard")} />
          <SideButton active={route === "courses"} iconName="book-open" label="All Categories" onClick={() => nav("courses")} />
          <SideButton active={route === "progress"} iconName="chart-line" label="Progress" onClick={() => nav("progress")} />
          <SideButton active={route === "achievements"} iconName="trophy" label="Achievements" onClick={() => nav("achievements")} />
          <SideButton active={route === "settings"} iconName="cog" label="Settings" onClick={() => nav("settings")} />
          <div className="corporate-divider" />
          <div className="corporate-section">Learn By</div>
          {families.map((family) => {
            const meta = FAMILY_META[family.slug];
            return (
              <button
                className="corporate-level-pill"
                key={family.slug}
                type="button"
                onClick={() => nav("courses", family.slug)}
              >
                <span>
                  {icon(meta.icon)}
                  <span>{meta.label}</span>
                </span>
                <strong style={{ color: meta.color }}>
                  {doneForFamily(family)}/{lessonCount(family)}
                </strong>
              </button>
            );
          })}
          <div className="corporate-credit">
            <img src="/corporate-platform/brice.webp" alt="Brice Gadou" />
            <span>
              <span className="corporate-credit-label">Crafted by</span>
              <span className="corporate-credit-name">Brice Gadou</span>
              <span className="corporate-credit-role">Business English Expert &amp; Vibe Coder</span>
            </span>
          </div>
        </aside>

        <main className="corporate-main">
          <header className="corporate-topbar">
            <button className="corporate-menu-btn" type="button" onClick={() => setSidebarOpen(true)}>
              {icon("bars")}
            </button>
            <div className="corporate-search-wrap">
              <span className="corporate-search-icon">{icon("search")}</span>
              <input
                type="text"
                placeholder={`Search ${totalLessons.toLocaleString("en-US")} lessons...`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setShowSearch(true)}
                onBlur={() => window.setTimeout(() => setShowSearch(false), 150)}
              />
              <div className={showSearch && query ? "corporate-search-results show" : "corporate-search-results"}>
                {searchResults.length ? (
                  searchResults.map(({ lesson, category }) => (
                    <button
                      className="corporate-sr-item"
                      key={lesson.href}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setQuery("");
                        setShowSearch(false);
                        openViewer(lesson, category.family.slug, category.slug);
                      }}
                      type="button"
                    >
                      <span className="corporate-sr-title">{lesson.title}</span>
                      <span className="corporate-sr-meta">
                        {category.label} - {category.family.label}
                      </span>
                    </button>
                  ))
                ) : (
                  <span className="corporate-sr-item">
                    <span className="corporate-sr-title muted">No results found</span>
                  </span>
                )}
              </div>
            </div>
            <div className="corporate-tb-actions">
              <span className="corporate-tb-xp">{state.xp} XP</span>
              <button
                className="corporate-tb-btn"
                type="button"
                title="Toggle theme"
                onClick={() => saveState((current) => ({ ...current, theme: current.theme === "dark" ? "light" : "dark" }))}
              >
                {icon(state.theme === "dark" ? "sun" : "moon")}
              </button>
              <button className="corporate-tb-btn" type="button" title="Achievements" onClick={() => nav("achievements")}>
                {icon("trophy")}
              </button>
            </div>
          </header>
          <div className="corporate-page">{renderPage()}</div>
        </main>
      </div>

      <nav className="corporate-bottomnav">
        <BottomButton active={route === "dashboard"} iconName="home" label="Home" onClick={() => nav("dashboard")} />
        <BottomButton active={route === "courses"} iconName="book-open" label="Learn" onClick={() => nav("courses")} />
        <BottomButton active={route === "progress"} iconName="chart-line" label="Progress" onClick={() => nav("progress")} />
        <BottomButton active={route === "achievements"} iconName="trophy" label="Badges" onClick={() => nav("achievements")} />
        <BottomButton active={route === "settings"} iconName="cog" label="Settings" onClick={() => nav("settings")} />
      </nav>

      {viewerLesson ? renderViewer() : null}
      <div className="corporate-toast">
        {toasts.map((item) => (
          <div className="corporate-toast-item" key={item.id}>
            {item.msg}
          </div>
        ))}
      </div>
    </div>
  );

  function renderPage() {
    if (route === "courses") return renderCourses();
    if (route === "progress") return renderProgress();
    if (route === "achievements") return renderAchievements();
    if (route === "settings") return renderSettings();
    return renderDashboard();
  }

  function renderDashboard() {
    const pct = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;
    return (
      <div className="corporate-page-stack">
        <section className="corporate-hero-card corporate-fade-up">
          <div className="corporate-hero-inner">
            <div>
              <div className="corporate-hero-kicker">Welcome back</div>
              <h1>{state.user.name}</h1>
              <p>Keep your streak alive - learn something new today.</p>
              <div className="corporate-hero-actions">
                <button className="corporate-btn-primary" type="button" onClick={() => nextLesson && openFirstAvailable(nextLesson)}>
                  {icon("play")} Continue Learning
                </button>
                <span className="corporate-streak">
                  {icon("fire")} <strong>{state.streak}</strong> day streak
                </span>
              </div>
            </div>
            <div className="corporate-done-ring">
              <div>
                <strong>{pct}%</strong>
                <span>Done</span>
              </div>
              <small>
                {completedCount} / {totalLessons.toLocaleString("en-US")}
              </small>
            </div>
          </div>
          <div className="corporate-overall">
            <div>
              <span>Overall Progress</span>
              <strong>{pct}%</strong>
            </div>
            <div className="corporate-progress-bar">
              <div style={{ width: `${pct}%` }} />
            </div>
          </div>
        </section>

        <section className="corporate-stats-grid corporate-fade-up delay-1">
          <StatCard iconName="bolt" label="Total XP" value={`${state.xp} XP`} color="#f59e0b" bg="rgba(245,158,11,.15)" />
          <StatCard iconName="fire" label="Streak" value={`${state.streak} days`} color="#ef4444" bg="rgba(239,68,68,.15)" />
          <StatCard iconName="book" label="Completed" value={`${completedCount} lessons`} color="#7c3aed" bg="rgba(124,58,237,.15)" />
          <StatCard
            iconName="folder-open"
            label="Catalog"
            value={`${totalLessons.toLocaleString("en-US")} lessons`}
            color="#10b981"
            bg="rgba(16,185,129,.15)"
          />
        </section>

        <section className="corporate-glass corporate-fade-up delay-2">
          <h2 className="corporate-section-title">{icon("layer-group")} Category Progress</h2>
          <div className="corporate-level-progress-grid">
            {families.map((family) => {
              const meta = FAMILY_META[family.slug];
              const done = doneForFamily(family);
              const total = lessonCount(family);
              const familyPct = total ? Math.round((done / total) * 100) : 0;
              return (
                <button className="corporate-level-mini" key={family.slug} type="button" onClick={() => nav("courses", family.slug)}>
                  <div>
                    <span>{icon(meta.icon)}</span>
                    <span>
                      <strong>{meta.label}</strong>
                      <small>
                        {family.categories.length} categories - {total.toLocaleString("en-US")} lessons
                      </small>
                    </span>
                  </div>
                  <div className="corporate-progress-bar">
                    <div style={{ background: meta.color, width: `${familyPct}%` }} />
                  </div>
                  <em style={{ color: meta.color }}>{familyPct}%</em>
                </button>
              );
            })}
          </div>
        </section>

        <section className="corporate-two-col corporate-fade-up delay-3">
          <div className="corporate-glass">
            <h2 className="corporate-section-title">{icon("bullseye")} Daily Goals</h2>
            <Goal label="Complete 1 lesson" meta="+15 XP" done={state.dailyDone >= 1} />
            <Goal label="Complete 3 lessons" meta="+45 XP" done={state.dailyDone >= 3} />
            <Goal label="Earn 50 XP today" meta="Bonus" done={state.xpToday >= 50} />
          </div>
          <div className="corporate-glass">
            <h2 className="corporate-section-title">{icon("star")} Up Next</h2>
            {lessons.slice(0, 5).map((lesson) => {
              const found = findLessonContext(lesson);
              return found ? (
                <button
                  className="corporate-mini-row"
                  key={lesson.href}
                  type="button"
                  onClick={() => openViewer(lesson, found.family.slug, found.category.slug)}
                >
                  <span className="corporate-mini-icon" style={{ background: FAMILY_META[found.family.slug].bg }}>
                    {icon(FAMILY_META[found.family.slug].icon)}
                  </span>
                  <span>
                    <strong>{lesson.title}</strong>
                    <small>
                      {found.category.label} - 15min
                    </small>
                  </span>
                  <em>+15XP</em>
                </button>
              ) : null;
            })}
          </div>
        </section>
      </div>
    );
  }

  function renderCourses() {
    if (!activeFamily) {
      return (
        <div className="corporate-page-stack">
          <div>
            <h1 className="corporate-page-title">All Categories</h1>
            <p className="corporate-page-desc">
              {totalLessons.toLocaleString("en-US")} lessons across {totalCategories} categories
            </p>
          </div>
          <div className="corporate-course-grid">
            {families.map((family) => renderFamilyCard(family))}
          </div>
        </div>
      );
    }

    const meta = FAMILY_META[activeFamily.slug];
    if (!activeCategory) {
      const done = doneForFamily(activeFamily);
      return (
        <div className="corporate-page-stack">
          <div className="corporate-breadcrumb">
            <button type="button" onClick={() => nav("courses")}>
              All Categories
            </button>
            <span>/</span>
            <span>{meta.label}</span>
          </div>
          <section className="corporate-level-hero">
            <div className="corporate-level-hero-icon">{icon(meta.icon)}</div>
            <div>
              <h2>{meta.label}</h2>
              <p>{meta.desc}</p>
            </div>
            <div className="corporate-level-hero-progress">
              <strong>{done}</strong>
              <span>of {lessonCount(activeFamily).toLocaleString("en-US")} done</span>
            </div>
          </section>
          <div className="corporate-lessons-grid">
            {activeFamily.categories.map((category) => renderCategoryCard(activeFamily, category))}
          </div>
        </div>
      );
    }

    const done = doneForCategory(activeCategory);
    const pct = Math.round((done / activeCategory.lessons.length) * 100);
    return (
      <div className="corporate-page-stack">
        <div className="corporate-breadcrumb">
          <button type="button" onClick={() => nav("courses")}>
            All Categories
          </button>
          <span>/</span>
          <button type="button" onClick={() => nav("courses", activeFamily.slug)}>
            {meta.label}
          </button>
          <span>/</span>
          <span>{activeCategory.label}</span>
        </div>
        <section className="corporate-level-hero">
          <div className="corporate-level-hero-icon">{icon(meta.icon)}</div>
          <div>
            <span>{meta.label}</span>
            <h2>{activeCategory.label}</h2>
            <p>{activeCategory.lessons.length} modules - about {activeCategory.lessons.length * 15} min total</p>
          </div>
          <div className="corporate-level-hero-progress">
            <strong>{done}</strong>
            <span>of {activeCategory.lessons.length} done</span>
            <div className="corporate-progress-bar">
              <div style={{ background: meta.color, width: `${pct}%` }} />
            </div>
          </div>
        </section>
        <div className="corporate-lessons-grid">
          {activeCategory.lessons.map((lesson) => renderLessonCard(activeFamily, activeCategory, lesson))}
        </div>
      </div>
    );
  }

  function renderProgress() {
    return (
      <div className="corporate-page-stack">
        <div>
          <h1 className="corporate-page-title">Progress Analytics</h1>
          <p className="corporate-page-desc">Track your professional English learning journey</p>
        </div>
        <section className="corporate-stats-grid">
          <StatCard iconName="book" label="Lessons Done" value={`${completedCount}`} color="#7c3aed" bg="rgba(124,58,237,.15)" />
          <StatCard iconName="bolt" label="XP Earned" value={`${state.xp}`} color="#f59e0b" bg="rgba(245,158,11,.15)" />
          <StatCard iconName="fire" label="Day Streak" value={`${state.streak}`} color="#ef4444" bg="rgba(239,68,68,.15)" />
          <StatCard iconName="clock" label="Minutes Studied" value={`${state.totalTime}`} color="#10b981" bg="rgba(16,185,129,.15)" />
        </section>
        <section className="corporate-glass">
          <h2 className="corporate-section-title">{icon("layer-group")} Category Breakdown</h2>
          <div className="corporate-breakdown">
            {families.map((family) => {
              const done = doneForFamily(family);
              const total = lessonCount(family);
              const pct = total ? Math.round((done / total) * 100) : 0;
              const meta = FAMILY_META[family.slug];
              return (
                <div key={family.slug}>
                  <div>
                    <span>
                      {icon(meta.icon)} {meta.label}
                    </span>
                    <span>
                      {done} / {total.toLocaleString("en-US")}
                      <strong style={{ color: meta.color }}>{pct}%</strong>
                    </span>
                  </div>
                  <div className="corporate-progress-bar">
                    <div style={{ background: meta.color, width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  function renderAchievements() {
    const badges = [
      { iconName: "seedling", title: "First Step", desc: "1 lesson", unlocked: completedCount >= 1 },
      { iconName: "book", title: "Bookworm", desc: "10 done", unlocked: completedCount >= 10 },
      { iconName: "bullseye", title: "On Target", desc: "25 done", unlocked: completedCount >= 25 },
      { iconName: "rocket", title: "Momentum", desc: "50 done", unlocked: completedCount >= 50 },
      { iconName: "gem", title: "Focused Learner", desc: "100 done", unlocked: completedCount >= 100 },
      { iconName: "crown", title: "Corporate Legend", desc: "1000 done", unlocked: completedCount >= 1000 },
    ];
    return (
      <div className="corporate-page-stack">
        <div>
          <h1 className="corporate-page-title">Achievements</h1>
          <p className="corporate-page-desc">{badges.filter((badge) => badge.unlocked).length} of {badges.length} badges earned</p>
        </div>
        <div className="corporate-badge-grid">
          {badges.map((badge) => (
            <div className={badge.unlocked ? "corporate-badge-card" : "corporate-badge-card locked"} key={badge.title}>
              <div>{icon(badge.iconName)}</div>
              <strong>{badge.title}</strong>
              <span>{badge.desc}</span>
              {badge.unlocked ? <em>Unlocked</em> : <small>Locked</small>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div className="corporate-settings">
        <div>
          <h1 className="corporate-page-title">Settings</h1>
        </div>
        <section className="corporate-glass">
          <h2 className="corporate-section-title">{icon("user-circle")} Profile</h2>
          <label className="corporate-label" htmlFor="corporate-display-name">Display Name</label>
          <div className="corporate-input-row">
            <input id="corporate-display-name" defaultValue={state.user.name} />
            <button
              className="corporate-btn-primary"
              type="button"
              onClick={() => {
                const input = document.getElementById("corporate-display-name") as HTMLInputElement | null;
                if (input?.value.trim()) saveState((current) => ({ ...current, user: { ...current.user, name: input.value.trim() } }));
              }}
            >
              Save
            </button>
          </div>
          <label className="corporate-label spaced">Choose Avatar</label>
          <div className="corporate-avatar-grid">
            {AVATARS.map((avatar) => (
              <button
                className={avatar.id === state.user.avatarId ? "selected" : ""}
                key={avatar.id}
                type="button"
                title={avatar.label}
                onClick={() => saveState((current) => ({ ...current, user: { ...current.user, avatarId: avatar.id } }))}
              >
                {avatar.emoji}
              </button>
            ))}
          </div>
        </section>
        <section className="corporate-glass corporate-setting-row">
          <div>
            <h2 className="corporate-section-title">{icon("palette")} Theme</h2>
            <span>Currently: <strong>{state.theme}</strong></span>
          </div>
          <button
            className="corporate-btn-primary"
            type="button"
            onClick={() => saveState((current) => ({ ...current, theme: current.theme === "dark" ? "light" : "dark" }))}
          >
            Toggle Dark / Light
          </button>
        </section>
      </div>
    );
  }

  function renderViewer() {
    const lesson = viewerLesson;
    if (!lesson) return null;
    const found = findLessonContext(lesson);
    const list = found?.category.lessons ?? [];
    const index = list.findIndex((candidate) => candidate.href === lesson.href);
    const previous = index > 0 ? list[index - 1] : null;
    const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null;
    const done = Boolean(state.completed[lessonKey(lesson)]);
    return (
      <div className={focusMode ? "corporate-viewer open focus" : "corporate-viewer open"}>
        <header className="corporate-vw-header">
          <button className="corporate-vw-btn" type="button" onClick={() => setViewerListCollapsed((current) => !current)}>{icon("bars")}</button>
          <button className="corporate-vw-btn" type="button" disabled={!previous} onClick={() => previous && openViewer(previous, found!.family.slug, found!.category.slug)}>{icon("chevron-left")}</button>
          <button className="corporate-vw-btn" type="button" disabled={!next} onClick={() => next && openViewer(next, found!.family.slug, found!.category.slug)}>{icon("chevron-right")}</button>
          <div className="corporate-vw-title-wrap">
            <div className="corporate-vw-title">{lesson.title}</div>
            <div className="corporate-vw-meta">{found ? `${found.category.label} - 15 min - +15 XP` : "+15 XP"}</div>
          </div>
          <Link className="corporate-vw-btn" href={lesson.href}>Route</Link>
          <button className="corporate-vw-btn done" type="button" onClick={markDone}>{done ? "Done" : "Mark Done"}</button>
          <button className="corporate-vw-btn focus-btn" type="button" onClick={() => setFocusMode((current) => !current)}>{icon(focusMode ? "compress" : "expand")} Focus</button>
          <button className="corporate-vw-btn" type="button" onClick={closeViewer}>{icon("times")}</button>
        </header>
        <div className="corporate-vw-body">
          <aside className={viewerListCollapsed ? "corporate-vw-list collapsed" : "corporate-vw-list"}>
            <div className="corporate-vw-level-header">
              <div>{found?.category.label}</div>
              <span>{list.length} lessons - {found?.family.label}</span>
            </div>
            <div className="corporate-vw-lessons">
              {list.map((lesson) => (
                <button
                    className={lesson.href === viewerLesson.href ? "corporate-vl-item active" : "corporate-vl-item"}
                  key={lesson.href}
                  type="button"
                  onClick={() => found && openViewer(lesson, found.family.slug, found.category.slug)}
                >
                  <span className={state.completed[lessonKey(lesson)] ? "corporate-vl-check done" : "corporate-vl-check"}>
                    {state.completed[lessonKey(lesson)] ? icon("check-circle") : null}
                  </span>
                  <span>
                    <span className="corporate-vl-title">{lesson.title}</span>
                    <span className="corporate-vl-meta">15min - +15XP</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>
          <div className="corporate-iframe-wrap">
            {lesson.contentUrl ? (
              <iframe src={lesson.contentUrl} title={lesson.title} allow="fullscreen" />
            ) : (
              <div className="corporate-content-missing">
                <strong>Lesson content unavailable</strong>
                <span>Open the route for the canonical lesson fallback.</span>
              </div>
            )}
          </div>
        </div>
        {focusMode ? (
          <button className="corporate-focus-exit" type="button" onClick={() => setFocusMode(false)}>
            {icon("compress")} Exit Focus
          </button>
        ) : null}
      </div>
    );
  }

  function renderFamilyCard(family: CorporatePlatformFamily) {
    const meta = FAMILY_META[family.slug];
    const total = lessonCount(family);
    const done = doneForFamily(family);
    const pct = total ? Math.round((done / total) * 100) : 0;
    return (
      <button className="corporate-level-card" key={family.slug} type="button" onClick={() => nav("courses", family.slug)}>
        <div className="corporate-level-card-head">
          <span className="corporate-level-card-icon" style={{ background: meta.bg, borderColor: `${meta.color}44` }}>
            {icon(meta.icon)}
          </span>
          <span>
            <strong>{meta.label}</strong>
            <small>{family.categories.length} categories - {total.toLocaleString("en-US")} lessons</small>
          </span>
          <em style={{ color: meta.color }}>{pct}%</em>
        </div>
        <p>{meta.desc}</p>
        <div className="corporate-progress-bar">
          <div style={{ background: meta.color, width: `${pct}%` }} />
        </div>
        <div className="corporate-level-card-foot">
          <span>{done} completed</span>
          <strong style={{ color: meta.color }}>Explore</strong>
        </div>
      </button>
    );
  }

  function renderCategoryCard(family: CorporatePlatformFamily, category: CorporatePlatformCategory) {
    const meta = FAMILY_META[family.slug];
    const done = doneForCategory(category);
    const pct = category.lessons.length ? Math.round((done / category.lessons.length) * 100) : 0;
    return (
      <button className="corporate-category-card" key={category.slug} type="button" onClick={() => nav("courses", family.slug, category.slug)}>
        <img src={category.thumbnailSrc} alt="" />
        <span className="corporate-lesson-head">
          <span style={{ background: meta.bg, color: meta.color }}>{category.lessons.length} lessons</span>
          {pct ? <em>{pct}%</em> : null}
        </span>
        <strong>{category.label}</strong>
        <div className="corporate-progress-bar">
          <div style={{ background: meta.color, width: `${pct}%` }} />
        </div>
        <Link href={category.href} onClick={(event) => event.stopPropagation()}>
          Open route
        </Link>
      </button>
    );
  }

  function renderLessonCard(family: CorporatePlatformFamily, category: CorporatePlatformCategory, lesson: CorporatePlatformLesson) {
    const meta = FAMILY_META[family.slug];
    const done = Boolean(state.completed[lessonKey(lesson)]);
    return (
      <button className={done ? "corporate-lesson-card completed" : "corporate-lesson-card"} key={lesson.href} type="button" onClick={() => openViewer(lesson, family.slug, category.slug)}>
        <Link className="corporate-focus-mini" href={lesson.href} onClick={(event) => event.stopPropagation()} title="Open canonical route">
          {icon("external-link-alt")}
        </Link>
        <span className="corporate-lesson-head">
          <span style={{ background: meta.bg, color: meta.color }}>{lesson.number ? `#${lesson.number}` : "Lesson"}</span>
          <em>15m</em>
        </span>
        <strong>{lesson.title}</strong>
        <span className="corporate-lesson-meta">
          <span>{icon("clock")} 15m</span>
          <span className="gold">{icon("star")} 15 XP</span>
          {done ? <span className="done">{icon("check-circle")} Done</span> : null}
        </span>
      </button>
    );
  }

  function findLessonContext(lesson: CorporatePlatformLesson | null) {
    if (!lesson) return null;
    for (const family of families) {
      for (const category of family.categories) {
        if (category.lessons.some((candidate) => candidate.href === lesson.href)) return { family, category };
      }
    }
    return null;
  }

  function openFirstAvailable(lesson: CorporatePlatformLesson) {
    const found = findLessonContext(lesson);
    if (found) openViewer(lesson, found.family.slug, found.category.slug);
  }
}

function lessonCount(family: CorporatePlatformFamily) {
  return family.categories.reduce((sum, category) => sum + category.lessons.length, 0);
}

function SideButton({
  active,
  iconName,
  label,
  onClick,
}: {
  active: boolean;
  iconName: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={active ? "corporate-nav-item active" : "corporate-nav-item"} type="button" onClick={onClick}>
      <span className="corporate-ni-icon">{icon(iconName)}</span>
      {label}
    </button>
  );
}

function BottomButton({
  active,
  iconName,
  label,
  onClick,
}: {
  active: boolean;
  iconName: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={active ? "corporate-bn-item active" : "corporate-bn-item"} type="button" onClick={onClick}>
      {icon(iconName)}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ iconName, label, value, color, bg }: { iconName: string; label: string; value: string; color: string; bg: string }) {
  return (
    <div className="corporate-stat-card">
      <span className="corporate-stat-icon" style={{ background: bg }}>
        {icon(iconName)}
      </span>
      <span className="corporate-stat-value" style={{ color }}>
        {value}
      </span>
      <span className="corporate-stat-label">{label}</span>
    </div>
  );
}

function Goal({ label, meta, done }: { label: string; meta: string; done: boolean }) {
  return (
    <div className="corporate-goal-item">
      <span className={done ? "corporate-goal-check done" : "corporate-goal-check"}>{icon("check")}</span>
      <span>
        <strong>{label}</strong>
        <small>{meta}</small>
      </span>
    </div>
  );
}
