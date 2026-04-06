"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "../../../components/shared/Card";
import Button from "../../../components/shared/Button";
import {
  getSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
} from "../../../lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured] = useState(hasSupabaseBrowserConfig());
  const [nextPath, setNextPath] = useState("/dashboard");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/dashboard";
    setNextPath(next);
  }, []);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (!active) return;
        if (event === "SIGNED_IN" && session) {
          router.replace(nextPath);
        }
      });

      const { data } = await supabase.auth.getSession();
      if (!active) {
        listener.subscription.unsubscribe();
        return;
      }

      if (data.session) {
        router.replace(nextPath);
      }

      return () => {
        listener.subscription.unsubscribe();
      };
    };

    let unsubscribe: (() => void) | undefined;
    void checkSession().then((cleanup) => {
      unsubscribe = cleanup;
    });

    return () => {
      active = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [router, nextPath]);

  const handleGoogleLogin = async () => {
    setError(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(
        "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }

    setIsLoading(true);
    const redirectTo = `${window.location.origin}/auth?next=${encodeURIComponent(
      nextPath
    )}`;

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 px-6 py-16 dark:bg-slate-950">
      <div className="mx-auto max-w-lg">
        <Card>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Continue with your Google account to access the workspace.
          </p>

          {!isConfigured ? (
            <p className="mt-4 text-sm text-[var(--accent-warm)]">
              Supabase auth is not configured. Add
              {" "}
              <code>NEXT_PUBLIC_SUPABASE_URL</code>
              {" "}
              and
              {" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
              {" "}
              in your environment.
            </p>
          ) : null}

          <div className="mt-6">
            <Button
              type="button"
              onClick={() => void handleGoogleLogin()}
              disabled={isLoading || !isConfigured}
              className="rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-5 py-2 text-xs font-semibold text-[#0c0b0a] hover:bg-[#d4ad55] disabled:opacity-60"
            >
              {isLoading ? "Redirecting..." : "Continue with Google"}
            </Button>
          </div>

          {error ? (
            <p className="mt-4 text-sm text-[var(--accent-warm)]">{error}</p>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
