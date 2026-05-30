"use client";

import { useEffect, useState } from "react";
import Card from "../../../components/shared/Card";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import { useTheme } from "../../../context/ThemeContext";

export default function SettingsPage() {
  const { mode: theme } = useTheme();
  const [email, setEmail] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameStatus, setNameStatus] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      if (!active || !data.user) return;

      const metadata = data.user.user_metadata ?? {};
      const existingPreferred =
        (typeof metadata.preferred_name === "string" && metadata.preferred_name) ||
        (typeof metadata.display_name === "string" && metadata.display_name) ||
        (typeof metadata.name === "string" && metadata.name) ||
        (typeof metadata.full_name === "string" && metadata.full_name) ||
        "";

      setPreferredName(existingPreferred);
      setEmail(data.user.email || "");
    };

    void loadUser();
    return () => {
      active = false;
    };
  }, []);

  const handleSavePreferredName = async () => {
    setNameError(null);
    setNameStatus(null);
    const value = preferredName.trim();
    if (!value) {
      setNameError("Preferred name cannot be empty.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setNameError("Authentication is not configured.");
      return;
    }

    setIsSavingName(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        preferred_name: value,
      },
    });
    setIsSavingName(false);

    if (error) {
      setNameError(error.message || "We could not update your preferred name.");
      return;
    }

    setNameStatus("Preferred name updated.");
  };

  return (
    <section className="py-6 sm:py-8">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-8">
          <p className="lumen-chip">
            Settings
          </p>
          <h1 className="lumen-heading mt-4 text-4xl sm:text-5xl">
            Workspace settings
          </h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Manage your workspace preferences and default behaviors.
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="lumen-heading text-2xl">Account</h2>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  Your current profile details.
                </p>
              </div>
              <span className="lumen-chip">
                Active
              </span>
            </div>
            <div className="mt-5 flex items-center gap-4 border-t border-[var(--border)] pt-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[image:var(--aurora-line)] font-mono text-sm font-bold text-[var(--accent-ink)]">
                {(preferredName.trim().charAt(0) || "U").toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {preferredName.trim() || "Learner"}
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  Preferred workspace name
                </p>
                {email ? <p className="text-xs text-[var(--ink-faint)]">{email}</p> : null}
              </div>
            </div>
            <div className="mt-4 space-y-3 rounded-[14px] border border-[var(--border)] bg-[var(--glass)] px-4 py-3">
              <label
                htmlFor="preferred-name"
                className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]"
              >
                Preferred name
              </label>
              <input
                id="preferred-name"
                type="text"
                value={preferredName}
                onChange={(event) => setPreferredName(event.target.value)}
                maxLength={60}
                className="lumen-focus w-full rounded-[14px] border border-[var(--border)] bg-[var(--glass)] px-4 py-3 text-sm text-[var(--ink)] transition focus:border-[var(--accent)]"
              />
              <button
                type="button"
                onClick={() => void handleSavePreferredName()}
                disabled={isSavingName}
                className="lumen-focus rounded-full bg-[image:var(--aurora-line)] px-4 py-2.5 text-xs font-extrabold text-[var(--accent-ink)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingName ? "Saving..." : "Save preferred name"}
              </button>
              {nameStatus ? (
                <p className="text-xs text-[var(--ink-muted)]">{nameStatus}</p>
              ) : null}
              {nameError ? (
                <p className="text-xs text-[var(--accent-warm)]">{nameError}</p>
              ) : null}
            </div>
          </Card>

          <Card className="p-6">
            <div>
              <h2 className="lumen-heading text-2xl">Appearance</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Control how your workspace looks and feels.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Theme
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  {theme === "dark" ? "Dark mode enabled" : "Light mode enabled"}
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Toggle from the top bar.
                </p>
              </div>
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)] px-4 py-3">
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

          <Card className="p-6">
            <div>
              <h2 className="lumen-heading text-2xl">
                Lesson Defaults
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                These values are chosen in each lesson or simulation flow.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Default level
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  Set per lesson
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  A1-C1 in generator forms
                </p>
              </div>
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Industry focus
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  Optional
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Entered during generation
                </p>
              </div>
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Default visibility
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  Per lesson
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Managed from lesson details
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div>
              <h2 className="lumen-heading text-2xl">
                Workspace Defaults
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Current workspace behaviors available in the MVP.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Lesson save mode
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  Manual save
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Save generated previews when ready.
                </p>
              </div>
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Sharing
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  Per lesson
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Controlled from lesson details.
                </p>
              </div>
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Notifications
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  Not configured
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  No scheduled digest in the MVP.
                </p>
              </div>
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  Team sharing
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  Not configured
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Single-workspace MVP behavior.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
