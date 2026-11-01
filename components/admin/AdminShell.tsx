"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type ThemePreference = "system" | "light" | "dark";

const navigation = [
  {
    heading: "Workspace",
    items: [
      { href: "/admin", label: "Overview", icon: "grid" },
      { href: "/admin/content", label: "Content", icon: "book" },
      { href: "/admin/users", label: "Users", icon: "users" },
    ],
  },
  {
    heading: "System",
    items: [{ href: "/admin/settings", label: "Settings", icon: "settings" }],
  },
] as const;

const titles: Record<string, string> = {
  "/admin": "Overview",
  "/admin/content": "Content explorer",
  "/admin/users": "Users",
  "/admin/settings": "Settings",
};

export default function AdminShell({
  children,
  adminEmail,
}: {
  children: ReactNode;
  adminEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<ThemePreference>("system");
  const [systemDark, setSystemDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const pageTitle = titles[pathname] || "Admin";
  const initials = adminEmail.slice(0, 1).toUpperCase() || "A";
  const darkIsActive = theme === "dark" || (theme === "system" && systemDark);

  useEffect(() => {
    try {
      const storedTheme = window.localStorage.getItem("langslate-admin-theme");
      if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);
      setCollapsed(window.localStorage.getItem("langslate-admin-sidebar") === "collapsed");
    } catch {
      // Storage may be unavailable in privacy-restricted browsers.
    }

    const media = window.matchMedia("(max-width: 900px)");
    const updateMobile = () => {
      setIsMobile(media.matches);
      if (!media.matches) setMobileMenuOpen(false);
    };
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const updateColorScheme = () => setSystemDark(colorScheme.matches);
    updateMobile();
    updateColorScheme();
    media.addEventListener("change", updateMobile);
    colorScheme.addEventListener("change", updateColorScheme);
    return () => {
      media.removeEventListener("change", updateMobile);
      colorScheme.removeEventListener("change", updateColorScheme);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
      if (event.key !== "Tab") return;
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const focusTimer = window.setTimeout(() => drawerRef.current?.querySelector<HTMLElement>("a[href]")?.focus(), 0);
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      mobileMenuButtonRef.current?.focus();
    };
  }, [mobileMenuOpen]);

  const toggleTheme = () => {
    const nextTheme: ThemePreference = darkIsActive ? "light" : "dark";
    setTheme(nextTheme);
    try {
      window.localStorage.setItem("langslate-admin-theme", nextTheme);
    } catch {
      // Theme still applies for this session if storage is unavailable.
    }
  };

  const signOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setSignOutError("");
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      router.replace("/auth");
    } catch {
      setSignOutError("Sign out failed. Please try again.");
      setIsSigningOut(false);
    }
  };

  const toggleSidebar = () => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem("langslate-admin-sidebar", next ? "collapsed" : "expanded");
      } catch {
        // Collapse state remains usable for this session.
      }
      return next;
    });
  };

  return (
    <div className="admin-root" data-admin-theme={theme} data-admin-collapsed={collapsed ? "true" : "false"}>
      <div className="admin-shell">
        {mobileMenuOpen ? (
          <button
            type="button"
            className="admin-sidebar-backdrop"
            aria-label="Close admin navigation"
            onClick={() => setMobileMenuOpen(false)}
          />
        ) : null}

        <aside
          ref={drawerRef}
          id="admin-navigation-drawer"
          className={`admin-sidebar${mobileMenuOpen ? " is-open" : ""}`}
          aria-label="Admin navigation"
          aria-hidden={isMobile && !mobileMenuOpen}
          inert={isMobile && !mobileMenuOpen}
        >
          <div className="admin-sidebar-brand">
            <Link href="/admin" className="admin-brand-link" onClick={() => setMobileMenuOpen(false)}>
              <span className="admin-logo" aria-hidden="true"><Icon name="book" /></span>
              <span className="admin-brand-copy"><strong>Langslate</strong><small>Admin</small></span>
            </Link>
          </div>

          <nav className="admin-nav">
            {navigation.map((group) => (
              <section className="admin-nav-group" key={group.heading} aria-label={group.heading}>
                <h2 className="admin-nav-heading">{group.heading}</h2>
                {group.items.map((item) => {
                  const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`admin-nav-link${active ? " is-active" : ""}`}
                      aria-current={active ? "page" : undefined}
                      aria-label={item.label}
                      title={item.label}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon name={item.icon} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </section>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <p className="admin-readonly-note">Read-only administration</p>
            <Link href="/dashboard" className="admin-nav-link admin-back-link" onClick={() => setMobileMenuOpen(false)}>
              <Icon name="arrow" />
              <span>Back to App</span>
            </Link>
          </div>
        </aside>

        <div className="admin-main-column">
          <header className="admin-topbar">
            <div className="admin-topbar-leading">
              <button
                type="button"
                ref={mobileMenuButtonRef}
                className="admin-icon-button admin-mobile-menu"
                aria-label={mobileMenuOpen ? "Close admin navigation" : "Open admin navigation"}
                aria-expanded={mobileMenuOpen}
                aria-controls="admin-navigation-drawer"
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                <Icon name={mobileMenuOpen ? "close" : "menu"} />
              </button>
              <button
                type="button"
                className="admin-icon-button admin-desktop-collapse"
                onClick={toggleSidebar}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Icon name="panel" />
              </button>
              <nav className="admin-breadcrumbs" aria-label="Breadcrumb">
                <Link href="/admin">Admin</Link>
                {pathname !== "/admin" ? <><span aria-hidden="true">/</span><span aria-current="page">{pageTitle}</span></> : <><span aria-hidden="true">/</span><span aria-current="page">Overview</span></>}
              </nav>
            </div>

            <div className="admin-topbar-actions">
              <button
                type="button"
                className="admin-icon-button"
                onClick={toggleTheme}
                aria-label={darkIsActive ? "Switch to light theme" : "Switch to dark theme"}
                title={darkIsActive ? "Switch to light theme" : "Switch to dark theme"}
              >
                <Icon name={darkIsActive ? "sun" : "moon"} />
              </button>
              <details className="admin-account-menu">
                <summary className="admin-account" title={adminEmail} aria-label="Administrator account menu">
                  <span className="admin-avatar" aria-hidden="true">{initials}</span>
                  <span className="admin-account-copy"><strong>Administrator</strong><small>{adminEmail}</small></span>
                  <Icon name="chevron" />
                </summary>
                <div className="admin-account-dropdown">
                  <p>{adminEmail}</p>
                  {signOutError ? <p className="admin-account-error" role="alert">{signOutError}</p> : null}
                  <button type="button" onClick={() => void signOut()} disabled={isSigningOut}>
                    {isSigningOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              </details>
              <Link href="/dashboard" className="admin-app-link">
                <Icon name="arrow" />
                <span>Back to App</span>
              </Link>
            </div>
          </header>

          <main id="admin-main" className="admin-content" tabIndex={-1}>{children}</main>
        </div>
      </div>
    </div>
  );
}

function Icon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  switch (name) {
    case "grid": return <svg {...common}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>;
    case "book": return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 5.5v14A2.5 2.5 0 0 1 6.5 17H20"/><path d="M8 7h8M8 10h8"/></svg>;
    case "users": return <svg {...common}><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"/><circle cx="9.5" cy="7.5" r="3.5"/><path d="M17 4.5a3.5 3.5 0 0 1 0 6.8M21 20v-1.5a4 4 0 0 0-3-3.87"/></svg>;
    case "settings": return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.2.9-1.2 2.1-1.4-.6a7.8 7.8 0 0 1-1.6.9l-.2 1.5h-2.5l-.3-1.5a7.8 7.8 0 0 1-1.6-.9l-1.4.6-1.2-2.1 1.2-.9a7.1 7.1 0 0 1 0-1.9l-1.2-.9 1.2-2.1 1.4.6a7.8 7.8 0 0 1 1.6-.9l.3-1.5h2.5l.2 1.5a7.8 7.8 0 0 1 1.6.9l1.4-.6 1.2 2.1-1.2.9a7.1 7.1 0 0 1-.1 1.8Z" transform="translate(-1 -1) scale(1.08)"/></svg>;
    case "panel": return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>;
    case "menu": return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
    case "close": return <svg {...common}><path d="m6 6 12 12M18 6 6 18"/></svg>;
    case "sun": return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>;
    case "moon": return <svg {...common}><path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/></svg>;
    case "arrow": return <svg {...common}><path d="M14 5h5v5M19 5l-9 9"/><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>;
    case "chevron": return <svg {...common}><path d="m8 10 4 4 4-4"/></svg>;
    default: return null;
  }
}
