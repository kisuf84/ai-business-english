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
    <section className="mobile-page-shell flex min-h-[70vh] items-center px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-xl">
        <Card className="p-6 sm:p-8">
          <p className="lumen-chip">
            Welcome
          </p>
          <h1 className="lumen-heading mt-4 text-3xl sm:text-4xl">
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
              className="lumen-focus w-full rounded-[14px] border border-[var(--border)] bg-[var(--glass)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="lumen-primary-action w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
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
