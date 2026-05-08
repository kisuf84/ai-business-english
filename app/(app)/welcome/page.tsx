"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "../../../components/shared/Card";
import {
  getSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
} from "../../../lib/supabase/client";

function resolveName(metadata: Record<string, unknown> | undefined): string {
  if (!metadata) return "";
  const candidates = [
    metadata.preferred_name,
    metadata.display_name,
    metadata.name,
    metadata.full_name,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return "";
}

export default function WelcomePage() {
  const router = useRouter();
  const [preferredName, setPreferredName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      if (!hasSupabaseBrowserConfig()) {
        router.replace("/auth?error=missing_supabase_config");
        return;
      }
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        router.replace("/auth?error=missing_supabase_config");
        return;
      }

      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!active || !session) {
        router.replace("/auth");
        return;
      }

      const existingName = resolveName(session.user.user_metadata);
      if (existingName) {
        router.replace("/dashboard");
      }
    };

    void loadSession();
    return () => {
      active = false;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const value = preferredName.trim();
    if (!value) {
      setError("Please enter the name you want us to use.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication is not configured correctly.");
      return;
    }

    setIsLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      data: { preferred_name: value },
    });

    if (updateError) {
      setError(updateError.message || "We could not save your preferred name.");
      setIsLoading(false);
      return;
    }

    router.replace("/dashboard");
  };

  return (
    <section className="min-h-[70vh] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-xl">
        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface-card)] p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Welcome
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
            What should we call you?
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            We will use this name in your workspace greeting.
          </p>

          <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
            <input
              type="text"
              value={preferredName}
              onChange={(event) => setPreferredName(event.target.value)}
              placeholder="e.g. Soufi"
              maxLength={60}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Saving..." : "Continue"}
            </button>
          </form>

          {error ? <p className="mt-4 text-sm text-[var(--accent-warm)]">{error}</p> : null}
        </Card>
      </div>
    </section>
  );
}
