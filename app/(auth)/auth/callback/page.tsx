"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "../../../../components/shared/Card";
import { getSupabaseBrowserClient } from "../../../../lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const completeOAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          if (active) router.replace("/auth?error=missing_supabase_config");
          return;
        }

        const { data: initialSessionData, error: initialSessionError } =
          await supabase.auth.getSession();
        if (initialSessionError) {
          console.error("[auth-callback]", initialSessionError);
        }
        if (initialSessionData.session) {
          router.replace("/dashboard");
          return;
        }

        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (!code) {
          router.replace(
            "/auth?error=callback_failed&error_description=no_code_or_session"
          );
          return;
        }

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error("[auth-callback]", exchangeError);
          router.replace(
            `/auth?error=callback_failed&error_description=${encodeURIComponent(
              exchangeError.message
            )}`
          );
          return;
        }

        const { data: postExchangeSessionData, error: postExchangeSessionError } =
          await supabase.auth.getSession();
        if (postExchangeSessionError) {
          console.error("[auth-callback]", postExchangeSessionError);
        }
        if (postExchangeSessionData.session) {
          router.replace("/dashboard");
          return;
        }

        router.replace(
          "/auth?error=callback_failed&error_description=no_code_or_session"
        );
      } catch (callbackError) {
        console.error("[auth-callback]", callbackError);
        if (!active) return;
        setError("We couldn’t complete Google sign-in. Redirecting back to login...");
        window.setTimeout(() => {
          if (!active) return;
          const message =
            callbackError instanceof Error
              ? callbackError.message
              : "unknown_callback_error";
          router.replace(
            `/auth?error=callback_failed&error_description=${encodeURIComponent(message)}`
          );
        }, 1200);
      }
    };

    void completeOAuth();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <section className="min-h-screen bg-slate-50 px-6 py-16 dark:bg-slate-950">
      <div className="mx-auto max-w-lg">
        <Card>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Finishing sign-in
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Please wait while we complete your Google login.
          </p>
          {error ? <p className="mt-4 text-sm text-[var(--accent-warm)]">{error}</p> : null}
        </Card>
      </div>
    </section>
  );
}
