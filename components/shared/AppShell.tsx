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

export default function AppShell({ children }: AppShellProps) {
  const { mode, toggleTheme } = useTheme();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    role: string;
    email: string;
    avatarUrl: string | null;
  }>({
    name: "Workspace User",
    role: "Member",
    email: "",
    avatarUrl: null,
  });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const navGroups = [
    {
      label: "Workspace",
      items: [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/simulation", label: "AI simulation" },
        { href: "/generator", label: "Generator" },
      ],
    },
    {
      label: "Library",
      items: [
        { href: "/my-courses", label: "My courses" },
        { href: "/library", label: "Lesson library" },
        { href: "/premium-classes", label: "Premium Classes" },
        { href: "/for-teachers", label: "For Teachers" },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/pricing", label: "Pricing" },
        { href: "/settings", label: "Settings" },
      ],
    },
  ];
  const legacyPageTitles: Record<string, string> = {
    "/lesson/new": "Generator",
    "/courses": "Generator",
  };
  const derivedPageTitle = pathname?.startsWith("/premium-classes")
    ? "Premium Classes"
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
        (typeof metadata.full_name === "string" && metadata.full_name) ||
        (typeof metadata.name === "string" && metadata.name) ||
        "Workspace User";
      const avatar =
        (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
        (typeof metadata.picture === "string" && metadata.picture) ||
        null;

      return {
        name: fullName,
        role: "Member",
        email: authUser?.email || "",
        avatarUrl: avatar,
      };
    };

    const syncAuth = async () => {
      if (!hasSupabaseBrowserConfig()) {
        if (!active) return;
        setUser({
          name: "Workspace User",
          role: "Member",
          email: "",
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
  const isLight = mode === "light";

  return (
    <div
      className="font-ui min-h-screen bg-[var(--surface)] text-[var(--ink)]"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-[280px] shrink-0 flex-col border-r border-[var(--sidebar-border)] bg-[image:var(--sidebar-bg)] px-[14px] py-[18px] lg:flex">
          <div className="rounded-[18px] border border-white/5 bg-white/[0.05] p-4">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-14 w-14 rounded-full border-2 border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/10 bg-[radial-gradient(circle_at_30%_30%,#f0a46b,#7d3f2a_70%)] text-sm font-bold text-white">
                  {initials || "U"}
                </div>
              )}
              <div>
                <div className="text-[17px] font-bold leading-[1.2] text-[var(--ink)]">
                  {user.name}
                </div>
                <div className="mt-1 text-sm text-[var(--ink-muted)]">
                  {user.email || user.role}
                </div>
              </div>
            </div>

            <div className="mt-[14px] inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-[14px] py-[10px] text-sm font-bold text-white">
              <span className="inline-block h-[18px] w-[18px] rounded-full border-2 border-white" />
              B2
            </div>

            <div className="mt-[14px] flex items-center gap-[10px] text-sm text-[var(--ink-muted)]">
              <span className="h-[18px] w-[18px] border-b-2 border-l-2 border-[var(--ink-muted)] opacity-80 [transform:skewX(-12deg)]" />
              Focus: Tech workspace
            </div>

            {isAuthReady ? (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className={`mt-4 w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  isLight
                    ? "border-[var(--border)] bg-white/40 text-[var(--ink)] hover:bg-white/70"
                    : "border-white/10 bg-transparent text-white hover:bg-white/[0.05]"
                }`}
              >
                Sign out
              </button>
            ) : null}
          </div>

          <div className="flex-1 px-1 pb-1 pt-2">
            {navGroups.map((group) => (
              <div key={group.label} className="mt-4 first:mt-0">
                <p className="px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ink-faint)]">
                  {group.label}
                </p>
                <nav className="mt-2 space-y-1.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        className={`flex items-center rounded-[14px] px-[14px] py-3 text-[15px] transition ${
                          isActive
                            ? isLight
                              ? "bg-[rgba(11,31,59,0.08)] font-semibold text-[var(--ink)]"
                              : "bg-white/[0.06] font-semibold text-white"
                            : isLight
                              ? "text-[var(--ink-muted)] hover:bg-[rgba(11,31,59,0.05)] hover:text-[var(--ink)]"
                              : "text-[var(--ink-muted)] hover:bg-white/[0.05] hover:text-white"
                        }`}
                        href={item.href}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}

            <div className="mt-4">
              <p className="px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ink-faint)]">
                Coming soon
              </p>
              <div className="mt-2 space-y-1.5">
                {[
                  "Session history",
                  "Team management",
                  "Subscription",
                  "Speaking Coach",
                ].map(
                  (label) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-[14px] px-[14px] py-3 text-[15px] text-[#7c89a4]"
                    >
                      <span>{label}</span>
                      <span className="rounded-full border border-white/5 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#7c89a4]">
                        Soon
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto rounded-[18px] border border-white/5 bg-white/[0.05] p-4">
            <div className="inline-flex items-center gap-[10px] rounded-full bg-[#1ccaf1] px-4 py-2.5 text-sm font-extrabold text-[#06121b]">
              <span className="inline-block h-4 w-4 border-b-[3px] border-l-[3px] border-current [transform:skew(-20deg)_rotate(-45deg)]" />
              {mode === "dark" ? "Dark workspace" : "Light workspace"}
            </div>
            <div className="mt-3 text-sm text-[var(--ink-muted)]">
              Generator and simulations stay pinned here for fast access.
            </div>
            <div className="mt-[10px] h-2 overflow-hidden rounded-full bg-white/[0.05]">
              <span className="block h-full w-[42%] rounded-full bg-[var(--accent)]" />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header
            className={`sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-3 px-3 py-3 backdrop-blur-[10px] sm:px-5 lg:flex-nowrap lg:px-7 ${
              isLight
                ? "border-b border-[var(--sidebar-border)] bg-[rgba(255,250,242,0.92)]"
                : "border-b border-white/[0.04] bg-[rgba(7,11,22,0.92)]"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={isMobileNavOpen}
                aria-controls="mobile-navigation-drawer"
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition lg:hidden ${
                  isLight
                    ? "border border-[var(--border)] bg-transparent text-[var(--ink)] hover:bg-[var(--surface-hover)]"
                    : "border border-white/10 bg-transparent text-white hover:bg-white/[0.05]"
                }`}
              >
                <span className="sr-only">Open navigation menu</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
              <div className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-[linear-gradient(135deg,#2e55ff_0%,#5f7cff_100%)] text-base font-extrabold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
                A
              </div>
              <div className="min-w-0 text-sm lg:text-[18px]">
                <span className={`font-extrabold tracking-[-0.02em] ${isLight ? "text-[var(--ink)]" : "text-white"}`}>
                  LangslateAI
                </span>
                <div className="mt-0.5 text-[12px] text-[var(--ink-muted)] sm:text-[14px]">
                  {pageTitle}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-[10px]">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
                title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                  isLight
                    ? "border border-[var(--border)] bg-transparent text-[var(--ink)] hover:bg-[var(--surface-hover)]"
                    : "border border-white/10 bg-transparent text-white hover:bg-white/[0.05]"
                }`}
              >
                {mode === "dark" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 2.25V4.5M12 19.5v2.25M4.76 4.76l1.59 1.59M17.65 17.65l1.59 1.59M2.25 12H4.5M19.5 12h2.25M4.76 19.24l1.59-1.59M17.65 6.35l1.59-1.59" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M20.25 14.31A8.25 8.25 0 1 1 9.69 3.75a6.75 6.75 0 1 0 10.56 10.56Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <Link
                href="/simulation"
                className={`min-w-0 flex-1 rounded-xl px-3 py-3 text-center text-sm font-bold transition sm:flex-none sm:px-[18px] sm:text-[15px] ${
                  isLight
                    ? "border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface-hover)]"
                    : "border border-white/10 text-white hover:bg-white/[0.05]"
                }`}
              >
                Start simulation
              </Link>
              <Link
                href="/generator"
                className="min-w-0 flex-1 rounded-xl bg-[var(--accent)] px-3 py-3 text-center text-sm font-bold text-white transition hover:opacity-90 sm:flex-none sm:px-[18px] sm:text-[15px]"
              >
                Open generator
              </Link>
            </div>
          </header>

          <div className="px-3 py-4 sm:px-5 sm:py-6 lg:px-7 lg:py-7">{children}</div>
        </main>
      </div>

      <div
        className={`fixed inset-0 z-40 lg:hidden ${isMobileNavOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!isMobileNavOpen}
      >
        <button
          type="button"
          aria-label="Close navigation menu"
          className={`absolute inset-0 transition ${isMobileNavOpen ? "bg-black/45 opacity-100" : "opacity-0"}`}
          onClick={() => setIsMobileNavOpen(false)}
        />
        <aside
          id="mobile-navigation-drawer"
          className={`absolute inset-y-0 left-0 flex w-[min(88vw,340px)] max-w-full flex-col border-r px-4 py-4 shadow-2xl transition-transform duration-200 ${
            isLight
              ? "border-[var(--sidebar-border)] bg-[var(--surface)]"
              : "border-white/10 bg-[#08111f]"
          } ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-[var(--ink)]">LangslateAI</p>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">Main navigation</p>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              aria-label="Close navigation menu"
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                isLight
                  ? "border border-[var(--border)] bg-transparent text-[var(--ink)] hover:bg-[var(--surface-hover)]"
                  : "border border-white/10 bg-transparent text-white hover:bg-white/[0.05]"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mt-4 rounded-[18px] border border-white/5 bg-white/[0.05] p-4">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-11 w-11 rounded-full border-2 border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/10 bg-[radial-gradient(circle_at_30%_30%,#f0a46b,#7d3f2a_70%)] text-sm font-bold text-white">
                  {initials || "U"}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--ink)]">{user.name}</p>
                <p className="truncate text-xs text-[var(--ink-muted)]">{user.email || user.role}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex-1 overflow-y-auto pb-4">
            {navGroups.map((group) => (
              <div key={group.label} className="mt-5 first:mt-0">
                <p className="px-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ink-faint)]">
                  {group.label}
                </p>
                <nav className="mt-2 space-y-1.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center rounded-[14px] px-4 py-3 text-[15px] transition ${
                          isActive
                            ? isLight
                              ? "bg-[rgba(11,31,59,0.08)] font-semibold text-[var(--ink)]"
                              : "bg-white/[0.06] font-semibold text-white"
                            : isLight
                              ? "text-[var(--ink-muted)] hover:bg-[rgba(11,31,59,0.05)] hover:text-[var(--ink)]"
                              : "text-[var(--ink-muted)] hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        <span className="min-w-0 break-words">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-[var(--border)] pt-4">
            <div className="flex gap-2">
              <Link
                href="/simulation"
                className={`min-w-0 flex-1 rounded-xl px-4 py-3 text-center text-sm font-bold transition ${
                  isLight
                    ? "border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface-hover)]"
                    : "border border-white/10 text-white hover:bg-white/[0.05]"
                }`}
              >
                Simulation
              </Link>
              <Link
                href="/generator"
                className="min-w-0 flex-1 rounded-xl bg-[var(--accent)] px-4 py-3 text-center text-sm font-bold text-white transition hover:opacity-90"
              >
                Generator
              </Link>
            </div>
            {isAuthReady ? (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  isLight
                    ? "border-[var(--border)] bg-white/40 text-[var(--ink)] hover:bg-white/70"
                    : "border-white/10 bg-transparent text-white hover:bg-white/[0.05]"
                }`}
              >
                Sign out
              </button>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
