"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "../../../../components/shared/Card";
import { getSupabaseBrowserClient } from "../../../../lib/supabase/client";
import { safeInternalRedirect } from "../../../../lib/auth/redirect";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const completeOAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const nextPath = safeInternalRedirect(params.get("next"));

        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          if (active) router.replace("/auth?error=missing_supabase_config");
          return;
        }

        const { data: initialSessionData, error: initialSessionError } = await supabase.auth.getSession();
        if (initialSessionError) {
          console.warn("[auth-callback] initial session unavailable");
        }
        if (initialSessionData.session) {
          router.replace(nextPath);
          return;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 500));
        const { data: delayedSessionData, error: delayedSessionError } = await supabase.auth.getSession();
        if (delayedSessionError) {
          console.warn("[auth-callback] delayed session unavailable");
        }
        if (delayedSessionData.session) {
          router.replace(nextPath);
          return;
        }

        const code = params.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.warn("[auth-callback] code exchange failed");
            router.replace("/auth?error=callback_failed");
            return;
          }

          const { data: postExchangeSessionData, error: postExchangeSessionError } =
            await supabase.auth.getSession();
          if (postExchangeSessionError) {
            console.warn("[auth-callback] exchanged session unavailable");
          }
          if (postExchangeSessionData.session) {
            router.replace(nextPath);
            return;
          }
        }

        const hash = window.location.hash || "";
        const hasHashTokens =
          hash.includes("access_token=") || hash.includes("refresh_token=");

        if (hasHashTokens) {
          await new Promise((resolve) => window.setTimeout(resolve, 500));
          const { data: hashSessionData, error: hashSessionError } =
            await supabase.auth.getSession();
          if (hashSessionError) {
            console.warn("[auth-callback] legacy hash session unavailable");
          }
          if (hashSessionData.session) {
            router.replace(nextPath);
            return;
          }
          router.replace("/auth?error=callback_failed");
          return;
        }

        router.replace("/auth?error=callback_failed");
      } catch (callbackError) {
        console.error("[auth-callback] unexpected failure", {
          name: callbackError instanceof Error ? callbackError.name : "unknown",
        });
        if (!active) return;
        setError("We couldn’t complete sign-in. Redirecting back to login...");
        window.setTimeout(() => {
          if (!active) return;
          router.replace("/auth?error=callback_failed");
        }, 1200);
      }
    };

    void completeOAuth();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <section className="min-h-screen px-6 py-16 lumen-shell-bg text-[var(--ink)]">
      <div className="mx-auto max-w-lg">
        <Card className="p-6 sm:p-8">
          <p className="lumen-chip mb-4">Authentication</p>
          <h1 className="lumen-heading text-3xl">
            Signing you in...
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
            Please wait while we securely log you into Langslate.
          </p>
          <p className="mt-1 text-sm text-[var(--ink-faint)]">
            You&rsquo;ll be redirected automatically.
          </p>
          {error ? <p className="mt-4 text-sm text-[var(--accent-warm)]">{error}</p> : null}
        </Card>
      </div>
    </section>
  );
}
