"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  getSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
} from "../../lib/supabase/client";
import { useTheme } from "../../context/ThemeContext";

type AppShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "/icons/objects-column_10742815.png" },
      { href: "/simulation", label: "AI simulation", icon: "/icons/chess-clock_7378982.png" },
      { href: "/generator", label: "Generator", icon: "/icons/tour-virtual_13794442.png" },
    ],
  },
  {
    label: "Library",
    items: [
      { href: "/lessons", label: "Lesson library", icon: "/icons/books-medical_9856367.png" },
      { href: "/premium-classes", label: "Premium Courses", icon: "/icons/digital-certificate_19008425.png" },
      { href: "/for-teachers", label: "For Teachers", icon: "/icons/chalkboard-user_10489812.png" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/pricing", label: "Pricing", icon: "/icons/comments-dollar_17919141.png" },
      { href: "/settings", label: "Settings", icon: "/icons/settings-sliders_16861487.png" },
    ],
  },
];

const legacyPageTitles: Record<string, string> = {
  "/lesson/new": "Generator",
  "/courses": "Generator",
};

function NavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`app-nav-item group ${
        isActive
          ? "app-nav-item-active"
          : ""
      }`}
    >
      <span
        className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] border ${
          isActive
            ? "border-transparent bg-[image:var(--grad-aurora)] text-[#0a0a14]"
            : "border-[var(--glass-border)] bg-[var(--glass)] text-[var(--ink-3)] group-hover:text-[var(--ink-1)]"
        }`}
      >
        <span
          aria-hidden="true"
          className="h-[18px] w-[18px] bg-current"
          style={{
            WebkitMaskImage: `url(${item.icon})`,
            maskImage: `url(${item.icon})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      </span>
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  );
}

function ThemeToggle({
  mode,
  toggleTheme,
  className = "",
}: {
  mode: "light" | "dark";
  toggleTheme: () => void;
  className?: string;
}) {
  const nextMode = mode === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextMode} mode`}
      title={`Switch to ${nextMode} mode`}
      className={`btn btn-ghost btn-icon lumen-focus ${className}`}
    >
      {mode === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 2.25V4.5M12 19.5v2.25M4.76 4.76l1.59 1.59M17.65 17.65l1.59 1.59M2.25 12H4.5M19.5 12h2.25M4.76 19.24l1.59-1.59M17.65 6.35l1.59-1.59"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20.25 14.31A8.25 8.25 0 1 1 9.69 3.75a6.75 6.75 0 1 0 10.56 10.56Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

export default function AppShell({ children }: AppShellProps) {
  const { mode, toggleTheme } = useTheme();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    role: string;
    avatarUrl: string | null;
  }>({
    name: "Learner",
    role: "Member",
    avatarUrl: null,
  });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isPremiumModuleReader =
    /^\/premium-classes\/[^/]+\/[^/]+$/.test(pathname || "");

  const derivedPageTitle = pathname?.startsWith("/premium-classes")
    ? "Premium Courses"
    : undefined;
  const pageTitle =
    navGroups.flatMap((group) => group.items).find((item) => item.href === pathname)
      ?.label ??
    derivedPageTitle ??
    (pathname ? legacyPageTitles[pathname] : undefined) ??
    "Dashboard";

  useEffect(() => {
    let active = true;

    const mapAuthUser = (authUser: {
      email?: string;
      user_metadata?: Record<string, unknown>;
    } | null) => {
      const metadata = authUser?.user_metadata ?? {};
      const fullName =
        (typeof metadata.preferred_name === "string" && metadata.preferred_name) ||
        (typeof metadata.full_name === "string" && metadata.full_name) ||
        "Learner";
      const avatar =
        (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
        (typeof metadata.picture === "string" && metadata.picture) ||
        null;

      return {
        name: fullName,
        role: "Member",
        avatarUrl: avatar,
      };
    };

    const syncAuth = async () => {
      if (!hasSupabaseBrowserConfig()) {
        if (!active) return;
        setUser({
          name: "Learner",
          role: "Member",
          avatarUrl: null,
        });
        setIsAuthReady(true);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (!active) return;
        setIsAuthReady(true);
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setUser(mapAuthUser(data.user ?? null));
      setIsAuthReady(true);

      const { data: authState } = supabase.auth.onAuthStateChange((_, session) => {
        setUser(mapAuthUser(session?.user ?? null));
      });

      return () => {
        authState.subscription.unsubscribe();
      };
    };

    let unsubscribe: (() => void) | undefined;
    void syncAuth().then((cleanup) => {
      unsubscribe = cleanup;
    });

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileNavOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileNavOpen]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.replace("/auth");
  };

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  const renderProfileAvatar = (sizeClassName: string) =>
    user.avatarUrl ? (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className={`${sizeClassName} rounded-full border border-[var(--border-strong)] object-cover`}
      />
    ) : (
      <div
        className={`${sizeClassName} grid place-items-center rounded-full border border-[var(--border-strong)] bg-[image:var(--aurora-line)] text-sm font-extrabold text-[var(--accent-ink)]`}
      >
        {initials || "U"}
      </div>
    );

  const renderNavigation = (onNavigate?: () => void) => (
    <div className="space-y-6">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="font-mono px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
            {group.label}
          </p>
          <nav className="mt-2 space-y-1.5">
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                onNavigate={onNavigate}
              />
            ))}
          </nav>
        </div>
      ))}
    </div>
  );

  return (
    <div className="font-ui min-h-screen overflow-x-hidden text-[var(--ink-1)]">
      <div className="aurora" />
      <div className="grain" />
      <div className="flex min-h-screen w-full">
        <aside
          className={`hidden shrink-0 flex-col transition-[width,padding] duration-200 lg:flex ${
            isSidebarCollapsed ? "w-0 overflow-hidden border-r-0 px-0" : "sidebar w-[var(--sidebar-w)] px-4 py-[18px]"
          }`}
          aria-hidden={isSidebarCollapsed}
        >
          {!isSidebarCollapsed ? (
            <>
              <div className="card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow text-[10px]">
                      Workspace
                    </p>
                    <h2 className="display mt-2 text-xl leading-none">
                      Langslate AI
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSidebarCollapsed(true)}
                    aria-label="Collapse sidebar"
                    className="btn btn-ghost btn-icon lumen-focus shrink-0 text-[var(--ink-2)] hover:text-[var(--ink-1)]"
                  >
                    <span aria-hidden="true">&lt;</span>
                  </button>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  {renderProfileAvatar("h-12 w-12")}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--ink-1)]">
                      {user.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-[var(--ink-3)]">
                      {user.role} profile
                    </p>
                  </div>
                </div>

                <p className="mt-5 rounded-[14px] border border-[var(--glass-border)] bg-[var(--glass)] p-3 text-xs leading-5 text-[var(--ink-2)]">
                  Generate lessons, run simulations, and manage teaching resources.
                </p>
              </div>

              <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                {renderNavigation()}
              </div>

              {isAuthReady ? (
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={isSigningOut}
                  className="btn btn-ghost lumen-focus mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </button>
              ) : null}
            </>
          ) : null}
        </aside>

        {isSidebarCollapsed ? (
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(false)}
            aria-label="Expand sidebar"
            className="btn btn-ghost btn-icon lumen-focus fixed left-4 top-24 z-30 hidden lg:inline-flex"
          >
            <span aria-hidden="true">&gt;</span>
          </button>
        ) : null}

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <header className="topbar z-30">
            <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 lg:flex-nowrap">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(true)}
                  aria-label="Open navigation menu"
                  aria-expanded={isMobileNavOpen}
                  aria-controls="mobile-navigation-drawer"
                  className="btn btn-ghost btn-icon lumen-focus shrink-0 lg:hidden"
                >
                  <span className="sr-only">Open navigation menu</span>
                  <span aria-hidden="true" className="font-mono text-sm font-bold">
                    =
                  </span>
                </button>

                <img
                  src="/logo/langslate-ai-logo.png"
                  alt="Langslate AI logo"
                  className="h-[38px] w-[38px] shrink-0 rounded-[12px] object-contain shadow-glow"
                />
                <div className="min-w-0">
                  <p className="display truncate text-xl leading-none text-[var(--ink-1)]">
                    Langslate AI
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[var(--ink-3)]">
                    {pageTitle}
                  </p>
                </div>
              </div>

              <div className="search order-3 w-full min-w-0 lg:order-2">
                <label className="lumen-focus block">
                  <span className="search-icon font-mono text-[11px] font-bold">
                    /
                  </span>
                  <input
                    type="search"
                    placeholder="Search lessons, simulations, courses"
                  />
                </label>
              </div>

              <div className="order-2 flex shrink-0 items-center gap-2 lg:order-3">
                <ThemeToggle mode={mode} toggleTheme={toggleTheme} />
                <Link
                  href="/simulation"
                  className="btn btn-ghost lumen-focus hidden sm:inline-flex"
                >
                  Start simulation
                </Link>
                <Link
                  href="/lesson/new"
                  className="btn btn-aurora lumen-focus"
                >
                  Create lesson
                </Link>
                <div className="hidden items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass)] p-1.5 pr-3 md:flex">
                  {renderProfileAvatar("h-8 w-8")}
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-3)]">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <div
            className={
              isPremiumModuleReader
                ? "h-[calc(100dvh-var(--topbar-h))] overflow-hidden p-0"
                : "px-[14px] py-[18px] sm:px-7 sm:py-7"
            }
          >
            <div
              className={
                isPremiumModuleReader
                  ? "h-full w-full max-w-none"
                  : "mx-auto max-w-[1400px]"
              }
            >
              {children}
            </div>
          </div>
        </main>
      </div>

      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          isMobileNavOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isMobileNavOpen}
      >
        <button
          type="button"
          aria-label="Close navigation menu"
          className={`absolute inset-0 transition ${
            isMobileNavOpen ? "bg-black/55 opacity-100 backdrop-blur-sm" : "opacity-0"
          }`}
          onClick={() => setIsMobileNavOpen(false)}
        />
        <aside
          id="mobile-navigation-drawer"
          className={`absolute inset-y-0 left-0 flex w-[min(88vw,360px)] max-w-full flex-col border-r border-[var(--sidebar-border)] bg-[image:var(--sidebar-bg)] px-4 py-4 shadow-2xl transition-transform duration-200 ${
            isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                Langslate AI
              </p>
              <p className="mt-1 truncate text-lg font-extrabold text-[var(--ink)]">
                Navigation
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              aria-label="Close navigation menu"
              className="lumen-focus grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--glass)] text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
            >
              <span aria-hidden="true">x</span>
            </button>
          </div>

          <div className="lumen-panel mt-4 rounded-[var(--radius-md)] p-4">
            <div className="flex items-center gap-3">
              {renderProfileAvatar("h-11 w-11")}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--ink)]">{user.name}</p>
                <p className="truncate text-xs text-[var(--ink-muted)]">{user.role}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 min-h-0 flex-1 overflow-y-auto pb-4">
            {renderNavigation(() => setIsMobileNavOpen(false))}
          </div>

          <div className="space-y-2 border-t border-[var(--border)] pt-4">
            <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[var(--glass-border)] bg-[var(--glass)] px-3 py-2">
              <span className="text-sm font-semibold text-[var(--ink)]">
                {mode === "dark" ? "Dark mode" : "Light mode"}
              </span>
              <ThemeToggle mode={mode} toggleTheme={toggleTheme} />
            </div>
            <div className="flex gap-2">
              <Link
                href="/simulation"
                className="lumen-focus min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[var(--glass)] px-4 py-3 text-center text-sm font-bold text-[var(--ink)]"
              >
                Start simulation
              </Link>
              <Link
                href="/lesson/new"
                className="lumen-focus min-w-0 flex-1 rounded-full bg-[image:var(--aurora-line)] px-4 py-3 text-center text-sm font-extrabold text-[var(--accent-ink)]"
              >
                Create lesson
              </Link>
            </div>
            {isAuthReady ? (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
                className="lumen-focus w-full rounded-full border border-[var(--border)] bg-[var(--glass)] px-4 py-3 text-sm font-bold text-[var(--ink-muted)] transition hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
