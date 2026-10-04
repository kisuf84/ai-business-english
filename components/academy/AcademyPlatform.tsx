"use client";

import { useEffect, useMemo, useState } from "react";
import "./academyPlatform.css";
import type { AcademyLevelLabel, AcademyRuntimeLesson, AcademyRuntimeLevel } from "../../lib/langslateAcademy";

type AcademyPlatformProps = {
  levels: AcademyRuntimeLevel[];
};

type Route = "dashboard" | "courses" | "progress" | "achievements" | "settings";

type AcademyState = {
  user: { name: string; avatarId: string };
  xp: number;
  xpToday: number;
  streak: number;
  lastActive: string | null;
  completed: Record<string, number>;
  dailyGoal: number;
  dailyDone: number;
  goalDate: string | null;
  theme: "dark" | "light";
  heatmap: Record<string, number>;
  totalTime: number;
};

const STATE_KEY = "la_state_v4";

const LEVEL_META: Record<
  AcademyLevelLabel,
  { label: string; color: string; bg: string; icon: string; desc: string }
> = {
  A0: { label: "A0 Absolute Beginner", color: "#06b6d4", bg: "rgba(6,182,212,.12)", icon: "🔤", desc: "Take your very first steps into English." },
  A1: { label: "A1 Beginner", color: "#10b981", bg: "rgba(16,185,129,.12)", icon: "🌱", desc: "Start your English journey from zero." },
  A2: { label: "A2 Elementary", color: "#3b82f6", bg: "rgba(59,130,246,.12)", icon: "📘", desc: "Build on the basics and gain confidence." },
  B1: { label: "B1 Intermediate", color: "#8b5cf6", bg: "rgba(139,92,246,.12)", icon: "🚀", desc: "Handle most everyday English situations." },
  B2: { label: "B2 Upper-Intermediate", color: "#f59e0b", bg: "rgba(245,158,11,.12)", icon: "★", desc: "Express yourself fluently and spontaneously." },
  C1: { label: "C1 Advanced", color: "#f43f5e", bg: "rgba(244,63,94,.12)", icon: "👑", desc: "Master English at a near-native level." },
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

function defaultState(): AcademyState {
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

function loadState(): AcademyState {
  if (typeof window === "undefined") return defaultState();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STATE_KEY) || "null") as Partial<AcademyState> | null;
    return parsed ? { ...defaultState(), ...parsed, user: { ...defaultState().user, ...parsed.user } } : defaultState();
  } catch {
    return defaultState();
  }
}

function lessonKey(lesson: AcademyRuntimeLesson) {
  return lesson.contentKey;
}

export default function AcademyPlatform({ levels }: AcademyPlatformProps) {
  const [state, setState] = useState<AcademyState>(() => defaultState());
  const [route, setRoute] = useState<Route>("dashboard");
  const [activeLevel, setActiveLevel] = useState<AcademyLevelLabel | null>(null);
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [viewerLesson, setViewerLesson] = useState<AcademyRuntimeLesson | null>(null);
  const [viewerListCollapsed, setViewerListCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const [confettiPieces, setConfettiPieces] = useState<{ id: number; left: number; size: number; color: string; duration: number; delay: number; rotate: number }[]>([]);

  const lessons = useMemo(() => levels.flatMap((level) => level.lessons), [levels]);
  const levelByLabel = useMemo(() => new Map(levels.map((level) => [level.label, level])), [levels]);
  const completedCount = Object.keys(state.completed).length;
  const currentAvatar = AVATARS.find((avatar) => avatar.id === state.user.avatarId) ?? AVATARS[0];

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
    document.documentElement.setAttribute("data-academy-theme", state.theme);
    try {
      window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace("#", "") || "dashboard";
      const [rawRoute, rawLevel] = hash.split("/");
      if (rawRoute === "lesson" && rawLevel) {
        const found = lessons.find((lesson) => lesson.id === Number(rawLevel));
        if (found) setViewerLesson(found);
        return;
      }
      const nextRoute = ["dashboard", "courses", "progress", "achievements", "settings"].includes(rawRoute)
        ? (rawRoute as Route)
        : "dashboard";
      setRoute(nextRoute);
      setActiveLevel(rawLevel ? (rawLevel.toUpperCase() as AcademyLevelLabel) : null);
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

  const saveState = (updater: (current: AcademyState) => AcademyState) => {
    setState((current) => updater(current));
  };

  const nav = (nextRoute: Route, level?: AcademyLevelLabel | null) => {
    setRoute(nextRoute);
    setActiveLevel(level ?? null);
    setSidebarOpen(false);
    setViewerLesson(null);
    window.history.replaceState(null, "", level ? `#${nextRoute}/${level}` : `#${nextRoute}`);
  };

  const toast = (msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((items) => [...items, { id, msg }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3200);
  };

  const confetti = () => {
    const colors = ["#7c3aed", "#4f46e5", "#f59e0b", "#10b981", "#f43f5e", "#60a5fa"];
    const pieces = Array.from({ length: 60 }, (_, index) => ({
      id: Date.now() + index,
      left: Math.random() * 100,
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 0.5,
      rotate: Math.random() * 360,
    }));
    setConfettiPieces(pieces);
    window.setTimeout(() => setConfettiPieces([]), 4600);
  };

  const openViewer = (lesson: AcademyRuntimeLesson) => {
    setViewerLesson(lesson);
    setViewerListCollapsed(false);
    setFocusMode(false);
    window.history.replaceState(null, "", `#lesson/${lesson.id}`);
  };

  const closeViewer = () => {
    setViewerLesson(null);
    setFocusMode(false);
    setViewerListCollapsed(false);
    window.history.replaceState(null, "", route === "courses" && activeLevel ? `#courses/${activeLevel}` : `#${route}`);
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
      xp: current.xp + viewerLesson.xp,
      xpToday: current.xpToday + viewerLesson.xp,
      dailyDone: current.dailyDone + 1,
      totalTime: current.totalTime + viewerLesson.duration,
      heatmap: { ...current.heatmap, [dateKey()]: (current.heatmap[dateKey()] || 0) + 1 },
    }));
    toast(`+${viewerLesson.xp} XP — ${viewerLesson.title}`);
    if (state.dailyDone + 1 === state.dailyGoal) {
      window.setTimeout(() => {
        toast("Daily goal reached! 🎉");
        confetti();
      }, 800);
    }
    if ([1, 10, 25, 50, 100].includes(completedCount + 1)) {
      window.setTimeout(() => {
        toast(`Badge unlocked! ${completedCount + 1} lessons 🏆`);
        confetti();
      }, 900);
    }
  };

  const viewerLevelLessons = viewerLesson ? levelByLabel.get(viewerLesson.level)?.lessons ?? [] : [];
  const viewerIndex = viewerLesson ? viewerLevelLessons.findIndex((lesson) => lesson.id === viewerLesson.id) : -1;
  const filteredSearch = query.trim()
    ? lessons
        .filter((lesson) => {
          const q = query.toLowerCase();
          return lesson.title.toLowerCase().includes(q) || lesson.level.toLowerCase().includes(q);
        })
        .slice(0, 8)
    : [];

  return (
    <div className="academy-platform">
      <div className={sidebarOpen ? "academy-overlay show" : "academy-overlay"} onClick={() => setSidebarOpen(false)} />
      <div className="academy-app">
        <aside className={sidebarOpen ? "academy-sidebar open" : "academy-sidebar"}>
          <button className="academy-logo" onClick={() => nav("dashboard")} title="Refresh" type="button">
            <img src="/academy/Logo.png" alt="Langslate" className="academy-logo-img" />
            <span>
              <span className="academy-logo-text">Langslate</span>
              <span className="academy-logo-sub">ACADEMY</span>
            </span>
          </button>
          <div className="academy-user">
            <div className="academy-avatar">{currentAvatar.emoji}</div>
            <div>
              <div className="academy-user-name">{state.user.name}</div>
              <div className="academy-user-streak">{state.streak} day streak 🔥</div>
            </div>
          </div>
          <div className="academy-xp-wrap">
            <div className="academy-xp-row"><span>Daily XP</span><span>{state.xpToday} / 100</span></div>
            <div className="academy-xp-bar"><div style={{ width: `${Math.min(100, Math.round((state.xpToday / 100) * 100))}%` }} /></div>
          </div>
          <div className="academy-section">Menu</div>
          <AcademyNavItem icon="fa-home" label="Dashboard" active={route === "dashboard"} onClick={() => nav("dashboard")} />
          <AcademyNavItem icon="fa-book-open" label="All Courses" active={route === "courses" && !activeLevel} onClick={() => nav("courses")} />
          <AcademyNavItem icon="fa-chart-line" label="Progress" active={route === "progress"} onClick={() => nav("progress")} />
          <AcademyNavItem icon="fa-trophy" label="Achievements" active={route === "achievements"} onClick={() => nav("achievements")} />
          <AcademyNavItem icon="fa-cog" label="Settings" active={route === "settings"} onClick={() => nav("settings")} />
          <div className="academy-divider" />
          <div className="academy-section">CEFR Levels</div>
          {levels.map((level) => {
            const done = level.lessons.filter((lesson) => state.completed[lessonKey(lesson)]).length;
            return (
              <button key={level.label} className="academy-level-pill" type="button" onClick={() => nav("courses", level.label)}>
                <span><span>{LEVEL_META[level.label].icon}</span><span>{level.label}</span></span>
                <strong style={{ color: LEVEL_META[level.label].color }}>{done}/{level.lessons.length}</strong>
              </button>
            );
          })}
          <div className="academy-credit">
            <img src="/academy/brice.webp" alt="Brice Gadou" />
            <div>
              <div className="academy-credit-label">Crafted by</div>
              <div className="academy-credit-name">Brice Gadou</div>
              <div className="academy-credit-role">Business English Expert &amp; Vibe Coder</div>
            </div>
          </div>
        </aside>

        <main className="academy-main">
          <header className="academy-topbar">
            <button className="academy-menu-btn" onClick={() => setSidebarOpen(true)} type="button" aria-label="Open menu">
              <i className="fas fa-bars" />
            </button>
            <div className="academy-search-wrap">
              <i className="fas fa-search academy-search-icon" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setShowSearch(true);
                }}
                onFocus={() => setShowSearch(Boolean(query.trim()))}
                onBlur={() => window.setTimeout(() => setShowSearch(false), 180)}
                placeholder={`Search ${lessons.length} lessons...`}
              />
              <div className={showSearch && query.trim() ? "academy-search-results show" : "academy-search-results"}>
                {filteredSearch.length ? filteredSearch.map((lesson) => (
                  <button key={lesson.contentKey} type="button" className="academy-sr-item" onMouseDown={(event) => event.preventDefault()} onClick={() => { setQuery(""); setShowSearch(false); openViewer(lesson); }}>
                    <span className="academy-sr-title">{lesson.title}</span>
                    <span className="academy-sr-meta">{lesson.level} · {lesson.duration}min · +{lesson.xp}XP</span>
                  </button>
                )) : <div className="academy-sr-item"><span className="academy-sr-title muted">No results found</span></div>}
              </div>
            </div>
            <div className="academy-tb-actions">
              <span className="academy-tb-xp">{state.xp} XP</span>
              <button className="academy-tb-btn" type="button" onClick={() => saveState((current) => ({ ...current, theme: current.theme === "dark" ? "light" : "dark" }))} title="Toggle theme">
                <i className={`fas ${state.theme === "dark" ? "fa-sun" : "fa-moon"}`} />
              </button>
              <button className="academy-tb-btn" type="button" onClick={() => nav("achievements")} title="Achievements">
                <i className="fas fa-trophy" />
              </button>
            </div>
          </header>

          <div className="academy-page">
            {route === "dashboard" ? <Dashboard levels={levels} lessons={lessons} state={state} openViewer={openViewer} nav={nav} /> : null}
            {route === "courses" ? <Courses levels={levels} activeLevel={activeLevel} state={state} openViewer={openViewer} nav={nav} /> : null}
            {route === "progress" ? <Progress levels={levels} state={state} /> : null}
            {route === "achievements" ? <Achievements levels={levels} state={state} /> : null}
            {route === "settings" ? <Settings state={state} saveState={saveState} toast={toast} /> : null}
          </div>
        </main>
      </div>

      <div className={viewerLesson ? `academy-viewer open ${focusMode ? "focus" : ""}` : "academy-viewer"}>
        <div className="academy-vw-header">
          <button className="academy-vw-btn" type="button" onClick={() => setViewerListCollapsed((value) => !value)}><i className="fas fa-bars" /></button>
          <button className="academy-vw-btn" type="button" onClick={() => viewerIndex > 0 && setViewerLesson(viewerLevelLessons[viewerIndex - 1])}><i className="fas fa-chevron-left" /></button>
          <button className="academy-vw-btn" type="button" onClick={() => viewerIndex < viewerLevelLessons.length - 1 && setViewerLesson(viewerLevelLessons[viewerIndex + 1])}><i className="fas fa-chevron-right" /></button>
          <div className="academy-vw-title-wrap">
            <div className="academy-vw-title">{viewerLesson?.title}</div>
            <div className="academy-vw-meta">{viewerLesson ? `${viewerLesson.level} · ${viewerLesson.duration} min · +${viewerLesson.xp} XP` : ""}</div>
          </div>
          <button className="academy-vw-btn done" type="button" onClick={markDone}><i className="fas fa-check" /> Done</button>
          <button className="academy-vw-btn focus-btn" type="button" onClick={() => setFocusMode((value) => !value)}><i className={`fas ${focusMode ? "fa-compress" : "fa-expand"}`} /> {focusMode ? "Exit Focus" : "Focus"}</button>
          <button className="academy-vw-btn" type="button" onClick={closeViewer}><i className="fas fa-times" /></button>
        </div>
        <div className="academy-vw-body">
          <aside className={viewerListCollapsed ? "academy-vw-list collapsed" : "academy-vw-list"}>
            <div className="academy-vw-level-header">
              <div>{viewerLesson ? LEVEL_META[viewerLesson.level].label : ""}</div>
              <span>{viewerLevelLessons.length} lessons</span>
            </div>
            <div className="academy-vw-lessons">
              {viewerLevelLessons.map((lesson) => {
                const done = Boolean(state.completed[lessonKey(lesson)]);
                return (
                  <button key={lesson.contentKey} className={viewerLesson?.id === lesson.id ? "academy-vl-item active" : "academy-vl-item"} type="button" onClick={() => setViewerLesson(lesson)}>
                    <span className={done ? "academy-vl-check done" : "academy-vl-check"}>{done ? <i className="fas fa-check" /> : null}</span>
                    <span>
                      <span className="academy-vl-title">{lesson.title}</span>
                      <span className="academy-vl-meta">{lesson.duration}min · +{lesson.xp}XP</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>
          <div className="academy-iframe-wrap">
            {viewerLesson?.contentUrl ? (
              <iframe src={viewerLesson.contentUrl} allow="fullscreen" />
            ) : (
              <div className="academy-content-missing">
                <strong>Lesson content URL is not configured.</strong>
                <span>Set LANGSLATE_CONTENT_BASE_URL to load Academy lessons from R2.</span>
              </div>
            )}
          </div>
        </div>
        <button className="academy-focus-exit" type="button" onClick={() => setFocusMode(false)}><i className="fas fa-compress" /> Exit Focus</button>
      </div>

      <nav className="academy-bottomnav">
        <BottomNavItem icon="fa-home" label="Home" active={route === "dashboard"} onClick={() => nav("dashboard")} />
        <BottomNavItem icon="fa-book-open" label="Courses" active={route === "courses"} onClick={() => nav("courses")} />
        <BottomNavItem icon="fa-chart-line" label="Progress" active={route === "progress"} onClick={() => nav("progress")} />
        <BottomNavItem icon="fa-trophy" label="Badges" active={route === "achievements"} onClick={() => nav("achievements")} />
        <BottomNavItem icon="fa-cog" label="Settings" active={route === "settings"} onClick={() => nav("settings")} />
      </nav>

      <div className="academy-toast">
        {toasts.map((item) => <div key={item.id} className="academy-toast-item">{item.msg}</div>)}
      </div>
      {confettiPieces.map((piece) => (
        <span
          key={piece.id}
          className="academy-confetti"
          style={{
            left: `${piece.left}vw`,
            width: piece.size,
            height: piece.size + 2,
            background: piece.color,
            animationDuration: `${piece.duration}s`,
            animationDelay: `${piece.delay}s`,
            transform: `rotate(${piece.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function AcademyNavItem({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={active ? "academy-nav-item active" : "academy-nav-item"} type="button" onClick={onClick}>
      <span className="academy-ni-icon"><i className={`fas ${icon}`} /></span>
      {label}
    </button>
  );
}

function BottomNavItem({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={active ? "academy-bn-item active" : "academy-bn-item"} type="button" onClick={onClick}>
      <i className={`fas ${icon}`} />
      <span>{label}</span>
    </button>
  );
}

function StatCard({ icon, label, value, bg, color }: { icon: string; label: string; value: string | number; bg: string; color: string }) {
  return (
    <div className="academy-stat-card">
      <div className="academy-stat-icon" style={{ background: bg }}><span>{icon}</span></div>
      <div className="academy-stat-value" style={{ color }}>{value}</div>
      <div className="academy-stat-label">{label}</div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color?: string }) {
  return <div className="academy-progress-bar"><div style={{ width: `${value}%`, background: color }} /></div>;
}

function Dashboard({
  levels,
  lessons,
  state,
  openViewer,
  nav,
}: {
  levels: AcademyRuntimeLevel[];
  lessons: AcademyRuntimeLesson[];
  state: AcademyState;
  openViewer: (lesson: AcademyRuntimeLesson) => void;
  nav: (route: Route, level?: AcademyLevelLabel | null) => void;
}) {
  const done = Object.keys(state.completed).length;
  const pct = Math.round((done / lessons.length) * 100);
  const next = lessons.find((lesson) => !state.completed[lessonKey(lesson)]) ?? lessons[0];
  const recent = Object.entries(state.completed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => lessons.find((lesson) => lesson.contentKey === key))
    .filter((lesson): lesson is AcademyRuntimeLesson => Boolean(lesson));
  const upcoming = lessons.filter((lesson) => !state.completed[lessonKey(lesson)]).slice(0, 5);

  return (
    <div className="academy-page-stack">
      <section className="academy-hero-card fade-up">
        <div className="academy-hero-inner">
          <div>
            <div className="academy-hero-kicker">Welcome back 👋</div>
            <h1>{state.user.name}</h1>
            <p>Keep your streak alive — learn something new today!</p>
            <div className="academy-hero-actions">
              <button className="academy-btn-primary" type="button" onClick={() => openViewer(next)}><i className="fas fa-play" /> Continue Learning</button>
              <span className="academy-streak"><span>🔥</span><strong>{state.streak}</strong> day streak</span>
            </div>
          </div>
          <div className="academy-done-ring">
            <div><strong>{pct}%</strong><span>Done</span></div>
            <small>{done} / {lessons.length}</small>
          </div>
        </div>
        <div className="academy-overall">
          <div><span>Overall Progress</span><strong>{pct}%</strong></div>
          <ProgressBar value={pct} />
        </div>
      </section>
      <div className="academy-stats-grid fade-up delay-1">
        <StatCard icon="⚡" label="Total XP" value={`${state.xp} XP`} bg="rgba(245,158,11,.15)" color="#f59e0b" />
        <StatCard icon="🔥" label="Streak" value={`${state.streak} days`} bg="rgba(239,68,68,.15)" color="#ef4444" />
        <StatCard icon="📚" label="Completed" value={`${done} lessons`} bg="rgba(124,58,237,.15)" color="#7c3aed" />
        <StatCard icon="📁" label="Lessons" value={`${lessons.length} total`} bg="rgba(16,185,129,.15)" color="#10b981" />
      </div>
      <div className="academy-two-col fade-up delay-2">
        <Panel title="Daily Goals" icon="fa-bullseye">
          <GoalItem label="Complete 1 lesson" value="+10 XP" done={state.dailyDone >= 1} />
          <GoalItem label="Complete 3 lessons" value="+25 XP" done={state.dailyDone >= 3} />
          <GoalItem label="Earn 50 XP today" value="Bonus" done={state.xpToday >= 50} />
        </Panel>
        <Panel title="Activity" icon="fa-calendar-check" sub="16-week learning activity">
          <Heatmap heatmap={state.heatmap} weeks={16} />
        </Panel>
      </div>
      <Panel title="CEFR Level Progress" icon="fa-layer-group" className="fade-up delay-3">
        <div className="academy-level-progress-grid">
          {levels.map((level) => {
            const meta = LEVEL_META[level.label];
            const levelDone = level.lessons.filter((lesson) => state.completed[lessonKey(lesson)]).length;
            const levelPct = Math.round((levelDone / level.lessons.length) * 100);
            return (
              <button className="academy-level-mini" key={level.label} type="button" onClick={() => nav("courses", level.label)}>
                <div><span>{meta.icon}</span><span><strong>{level.label}</strong><small>{levelDone}/{level.lessons.length}</small></span></div>
                <ProgressBar value={levelPct} color={meta.color} />
                <em style={{ color: meta.color }}>{levelPct}%</em>
              </button>
            );
          })}
        </div>
      </Panel>
      <div className="academy-two-col fade-up delay-4">
        <Panel title="Recent Lessons" icon="fa-history">
          {(recent.length ? recent : []).map((lesson) => <MiniLesson key={lesson.contentKey} lesson={lesson} done openViewer={openViewer} />)}
          {!recent.length ? <div className="academy-empty">Start your first lesson!</div> : null}
        </Panel>
        <Panel title="Up Next" icon="fa-star">
          {upcoming.map((lesson) => <MiniLesson key={lesson.contentKey} lesson={lesson} openViewer={openViewer} />)}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, icon, sub, className = "", children }: { title: string; icon: string; sub?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`academy-glass ${className}`}>
      <div className="academy-section-title"><i className={`fas ${icon}`} /> {title}</div>
      {sub ? <div className="academy-panel-sub">{sub}</div> : null}
      {children}
    </section>
  );
}

function GoalItem({ label, value, done }: { label: string; value: string; done: boolean }) {
  return (
    <div className="academy-goal-item">
      <span className={done ? "academy-goal-check done" : "academy-goal-check"}><i className="fas fa-check" /></span>
      <span><strong>{label}</strong><small>{value}</small></span>
    </div>
  );
}

function MiniLesson({ lesson, done = false, openViewer }: { lesson: AcademyRuntimeLesson; done?: boolean; openViewer: (lesson: AcademyRuntimeLesson) => void }) {
  const meta = LEVEL_META[lesson.level];
  return (
    <button className="academy-mini-row" type="button" onClick={() => openViewer(lesson)}>
      <span className="academy-mini-icon" style={{ background: meta.bg }}>{meta.icon}</span>
      <span><strong>{lesson.title}</strong><small>{lesson.level} · {lesson.duration}min</small></span>
      {done ? <i className="fas fa-check-circle academy-done-icon" /> : <em>+{lesson.xp}XP</em>}
    </button>
  );
}

function Courses({
  levels,
  activeLevel,
  state,
  openViewer,
  nav,
}: {
  levels: AcademyRuntimeLevel[];
  activeLevel: AcademyLevelLabel | null;
  state: AcademyState;
  openViewer: (lesson: AcademyRuntimeLesson) => void;
  nav: (route: Route, level?: AcademyLevelLabel | null) => void;
}) {
  if (!activeLevel) {
    const total = levels.reduce((sum, level) => sum + level.lessons.length, 0);
    return (
      <div className="academy-page-stack">
        <div className="fade-up"><h2 className="academy-page-title">All Courses</h2><p className="academy-page-desc">{total} lessons across 6 CEFR levels</p></div>
        <div className="academy-course-grid fade-up delay-1">
          {levels.map((level) => <LevelCard key={level.label} level={level} state={state} onClick={() => nav("courses", level.label)} />)}
        </div>
      </div>
    );
  }

  const level = levels.find((item) => item.label === activeLevel) ?? levels[0];
  const meta = LEVEL_META[level.label];
  const done = level.lessons.filter((lesson) => state.completed[lessonKey(lesson)]).length;
  return (
    <div className="academy-page-stack">
      <section className="academy-level-hero fade-up">
        <div className="academy-level-hero-icon">{meta.icon}</div>
        <div><span>{level.label}</span><h2>{meta.label}</h2><p>{meta.desc}</p></div>
        <div className="academy-level-hero-progress"><strong>{done}</strong><span>of {level.lessons.length} done</span><ProgressBar value={Math.round((done / level.lessons.length) * 100)} color={meta.color} /></div>
      </section>
      <div className="academy-tabs fade-up delay-1">
        {levels.map((item) => <button key={item.label} className={item.label === level.label ? "active" : ""} type="button" onClick={() => nav("courses", item.label)}>{LEVEL_META[item.label].icon} {item.label}</button>)}
      </div>
      <div className="academy-lessons-grid fade-up delay-2">
        {level.lessons.map((lesson) => <LessonCard key={lesson.contentKey} lesson={lesson} done={Boolean(state.completed[lessonKey(lesson)])} openViewer={openViewer} />)}
      </div>
    </div>
  );
}

function LevelCard({ level, state, onClick }: { level: AcademyRuntimeLevel; state: AcademyState; onClick: () => void }) {
  const meta = LEVEL_META[level.label];
  const done = level.lessons.filter((lesson) => state.completed[lessonKey(lesson)]).length;
  const pct = Math.round((done / level.lessons.length) * 100);
  return (
    <button className="academy-level-card" type="button" onClick={onClick}>
      <div className="academy-level-card-head">
        <span className="academy-level-card-icon" style={{ background: meta.bg, borderColor: `${meta.color}44` }}>{meta.icon}</span>
        <span><strong>{meta.label}</strong><small>{level.lessons.length} lessons</small></span>
        <em style={{ color: meta.color }}>{pct}%</em>
      </div>
      <p>{meta.desc}</p>
      <ProgressBar value={pct} color={meta.color} />
      <div className="academy-level-card-foot"><span>{done} completed</span><strong style={{ color: meta.color }}>Explore →</strong></div>
    </button>
  );
}

function LessonCard({ lesson, done, openViewer }: { lesson: AcademyRuntimeLesson; done: boolean; openViewer: (lesson: AcademyRuntimeLesson) => void }) {
  const meta = LEVEL_META[lesson.level];
  return (
    <button className={done ? "academy-lesson-card completed" : "academy-lesson-card"} type="button" onClick={() => openViewer(lesson)}>
      <span className="academy-focus-mini"><i className="fas fa-expand" /></span>
      <span className="academy-lesson-head"><span style={{ background: meta.bg, color: meta.color }}>{lesson.level}</span><em>#{lesson.id}</em></span>
      <strong>{lesson.title}</strong>
      <span className="academy-lesson-meta">
        <span><i className="fas fa-clock" /> {lesson.duration}m</span>
        <span className="gold">★ {lesson.xp} XP</span>
        {done ? <span className="done"><i className="fas fa-check-circle" /> Done</span> : null}
      </span>
    </button>
  );
}

function Progress({ levels, state }: { levels: AcademyRuntimeLevel[]; state: AcademyState }) {
  const done = Object.keys(state.completed).length;
  return (
    <div className="academy-page-stack">
      <div className="fade-up"><h2 className="academy-page-title">Progress Analytics</h2><p className="academy-page-desc">Track your English learning journey</p></div>
      <div className="academy-stats-grid fade-up delay-1">
        <StatCard icon="📚" label="Lessons Done" value={done} bg="rgba(124,58,237,.15)" color="#7c3aed" />
        <StatCard icon="⚡" label="XP Earned" value={state.xp} bg="rgba(245,158,11,.15)" color="#f59e0b" />
        <StatCard icon="🔥" label="Day Streak" value={state.streak} bg="rgba(239,68,68,.15)" color="#ef4444" />
        <StatCard icon="⏰" label="Minutes Studied" value={state.totalTime} bg="rgba(16,185,129,.15)" color="#10b981" />
      </div>
      <Panel title="Level Breakdown" icon="fa-layer-group" className="fade-up delay-2">
        <div className="academy-breakdown">
          {levels.map((level) => {
            const meta = LEVEL_META[level.label];
            const levelDone = level.lessons.filter((lesson) => state.completed[lessonKey(lesson)]).length;
            const pct = Math.round((levelDone / level.lessons.length) * 100);
            return <div key={level.label}><div><span>{meta.icon} {meta.label}</span><span>{levelDone} / {level.lessons.length} <strong style={{ color: meta.color }}>{pct}%</strong></span></div><ProgressBar value={pct} color={meta.color} /></div>;
          })}
        </div>
      </Panel>
      <Panel title="Activity Heatmap" icon="fa-fire" sub="52 weeks of learning" className="fade-up delay-3">
        <div className="academy-heatmap-scroll"><Heatmap heatmap={state.heatmap} weeks={52} /></div>
        <div className="academy-heatmap-legend"><span>Less</span><i /><i className="heat1" /><i className="heat2" /><i className="heat3" /><i className="heat4" /><span>More</span></div>
      </Panel>
    </div>
  );
}

function Achievements({ levels, state }: { levels: AcademyRuntimeLevel[]; state: AcademyState }) {
  const done = Object.keys(state.completed).length;
  const badges = [
    { icon: "🌿", title: "First Step", desc: "1 lesson", xp: 25, unlocked: done >= 1 },
    { icon: "📖", title: "Bookworm", desc: "10 done", xp: 50, unlocked: done >= 10 },
    { icon: "🎯", title: "On Target", desc: "25 done", xp: 75, unlocked: done >= 25 },
    { icon: "🚀", title: "Rocket", desc: "50 done", xp: 100, unlocked: done >= 50 },
    { icon: "💎", title: "Gem Learner", desc: "100 done", xp: 150, unlocked: done >= 100 },
    { icon: "⭐", title: "Star Student", desc: "200 done", xp: 200, unlocked: done >= 200 },
    { icon: "🔥", title: "On Fire", desc: "7-day streak", xp: 100, unlocked: state.streak >= 7 },
    { icon: "⚡", title: "XP Legend", desc: "1000 XP", xp: 200, unlocked: state.xp >= 1000 },
    ...levels.map((level) => ({ icon: LEVEL_META[level.label].icon, title: `${level.label} Master`, desc: `All ${level.label}`, xp: 150, unlocked: level.lessons.every((lesson) => state.completed[lessonKey(lesson)]) })),
  ];
  return (
    <div className="academy-page-stack">
      <div className="fade-up"><h2 className="academy-page-title">Achievements</h2><p className="academy-page-desc">{badges.filter((badge) => badge.unlocked).length} of {badges.length} badges earned</p></div>
      <div className="academy-badge-grid fade-up delay-1">
        {badges.map((badge) => <div key={badge.title} className={badge.unlocked ? "academy-badge-card" : "academy-badge-card locked"}><div>{badge.icon}</div><strong>{badge.title}</strong><span>{badge.desc}</span>{badge.unlocked ? <em>+{badge.xp} XP</em> : <small>🔒 Locked</small>}</div>)}
      </div>
    </div>
  );
}

function Settings({ state, saveState, toast }: { state: AcademyState; saveState: (updater: (current: AcademyState) => AcademyState) => void; toast: (msg: string) => void }) {
  const [name, setName] = useState(state.user.name);
  return (
    <div className="academy-settings">
      <div className="fade-up"><h2 className="academy-page-title">Settings</h2></div>
      <Panel title="Profile" icon="fa-user-circle" className="fade-up delay-1">
        <label className="academy-label">Display Name</label>
        <div className="academy-input-row"><input value={name} onChange={(event) => setName(event.target.value)} /><button className="academy-btn-primary" type="button" onClick={() => { if (name.trim()) { saveState((current) => ({ ...current, user: { ...current.user, name: name.trim() } })); toast("Name saved!"); } }}>Save</button></div>
        <label className="academy-label spaced">Choose Avatar</label>
        <div className="academy-muted">5 male &amp; 5 female options</div>
        <div className="academy-avatar-grid">
          {AVATARS.map((avatar) => <button key={avatar.id} title={avatar.label} className={state.user.avatarId === avatar.id ? "selected" : ""} type="button" onClick={() => { saveState((current) => ({ ...current, user: { ...current.user, avatarId: avatar.id } })); toast("Avatar updated!"); }}>{avatar.emoji}</button>)}
        </div>
      </Panel>
      <Panel title="Theme" icon="fa-palette" className="fade-up delay-2">
        <div className="academy-setting-row"><span>Currently: {state.theme}</span><button className="academy-btn-primary" type="button" onClick={() => saveState((current) => ({ ...current, theme: current.theme === "dark" ? "light" : "dark" }))}><i className="fas fa-adjust" /> Toggle Dark / Light</button></div>
      </Panel>
      <Panel title="Daily Lesson Goal" icon="fa-bullseye" className="fade-up delay-3">
        <div className="academy-setting-row"><span>Lessons per day</span><strong>{state.dailyGoal}</strong></div>
        <input className="academy-range" type="range" min="1" max="10" value={state.dailyGoal} onChange={(event) => saveState((current) => ({ ...current, dailyGoal: Number(event.target.value) }))} />
      </Panel>
      <section className="academy-glass fade-up delay-4">
        <div className="academy-section-title danger"><i className="fas fa-trash" /> Reset Progress</div>
        <button className="academy-btn-ghost danger" type="button" onClick={() => { if (window.confirm("Reset all progress?")) { window.localStorage.removeItem(STATE_KEY); window.location.reload(); } }}>Reset All Progress</button>
      </section>
    </div>
  );
}

function Heatmap({ heatmap, weeks }: { heatmap: Record<string, number>; weeks: number }) {
  const today = new Date();
  const columns = [];
  for (let w = weeks - 1; w >= 0; w -= 1) {
    const cells = [];
    for (let d = 6; d >= 0; d -= 1) {
      const dt = new Date(today);
      dt.setDate(today.getDate() - (w * 7 + d));
      const key = dt.toISOString().split("T")[0];
      const count = heatmap[key] || 0;
      const cls = count === 0 ? "" : count === 1 ? "heat1" : count <= 3 ? "heat2" : count <= 5 ? "heat3" : "heat4";
      cells.push(<span key={key} className={cls} title={`${key}: ${count}`} />);
    }
    columns.push(<div key={w}>{cells}</div>);
  }
  return <div className="academy-heatmap">{columns}</div>;
}
