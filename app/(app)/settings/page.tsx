"use client";

import { useEffect, useState } from "react";
import Card from "../../../components/shared/Card";

export default function SettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("theme");
      setTheme(saved === "dark" ? "dark" : "light");
    } catch {
      setTheme("light");
    }
  }, []);

  return (
    <section className="py-10">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Settings
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            Workspace settings
          </h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Manage your workspace preferences and default behaviors.
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl text-[var(--ink)]">Account</h2>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  Your current profile details.
                </p>
              </div>
              <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                Mocked
              </span>
            </div>
            <div className="mt-5 flex items-center gap-4 border-t border-[var(--border)] pt-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] font-serif text-sm text-white">
                A
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  Alex Morgan
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  Product Manager
                </p>
                <p className="text-xs text-[var(--ink-faint)]">
                  alex@company.com
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-xs text-[var(--ink-muted)]">
              Google login and account management are coming next.
            </div>
          </Card>

          <Card className="rounded-3xl p-6">
            <div>
              <h2 className="font-serif text-xl text-[var(--ink)]">Appearance</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Control how your workspace looks and feels.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Theme
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  {theme === "dark" ? "Dark mode enabled" : "Light mode enabled"}
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Toggle from the sidebar profile card.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Mode
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  Light / Dark
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Stored on this device for now.
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl p-6">
            <div>
              <h2 className="font-serif text-xl text-[var(--ink)]">
                Learning Preferences
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Set defaults for lesson generation and practice.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Default level
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  B2
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  CEFR standard
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Industry focus
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  Technology
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Used in lesson prompts
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Default visibility
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  Private
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Change per lesson
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl p-6">
            <div>
              <h2 className="font-serif text-xl text-[var(--ink)]">
                Workspace Defaults
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Configure how your team workspace behaves.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Lesson save mode
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  Auto-save on generation
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Keep every lesson draft.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Sharing
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  Public links disabled
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Enable per lesson when needed.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Notifications
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  Weekly summary
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Activity recap delivered weekly.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Team sharing
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  Invite-only
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Control access for collaborators.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
