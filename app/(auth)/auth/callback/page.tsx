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
        console.error("[auth-callback]", {
          href: window.location.href,
          search: window.location.search,
          hash: window.location.hash,
        });

        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          if (active) router.replace("/auth?error=missing_supabase_config");
          return;
        }

        const { data: initialSessionData, error: initialSessionError } = await supabase.auth.getSession();
        if (initialSessionError) {
          console.error("[auth-callback]", initialSessionError);
        }
        console.log("[auth-callback-debug]", {
          href: window.location.href,
          search: window.location.search,
          hash: window.location.hash,
          session: Boolean(initialSessionData.session),
          step: "initial_get_session",
        });
        if (initialSessionData.session) {
          router.replace("/dashboard");
          return;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 500));
        const { data: delayedSessionData, error: delayedSessionError } = await supabase.auth.getSession();
        if (delayedSessionError) {
          console.error("[auth-callback]", delayedSessionError);
        }
        console.log("[auth-callback-debug]", {
          href: window.location.href,
          search: window.location.search,
          hash: window.location.hash,
          session: Boolean(delayedSessionData.session),
          step: "delayed_get_session",
        });
        if (delayedSessionData.session) {
          router.replace("/dashboard");
          return;
        }

        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
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
          console.log("[auth-callback-debug]", {
            href: window.location.href,
            search: window.location.search,
            hash: window.location.hash,
            session: Boolean(postExchangeSessionData.session),
            step: "post_exchange_get_session",
          });
          if (postExchangeSessionData.session) {
            router.replace("/dashboard");
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
            console.error("[auth-callback]", hashSessionError);
          }
          console.log("[auth-callback-debug]", {
            href: window.location.href,
            search: window.location.search,
            hash: window.location.hash,
            session: Boolean(hashSessionData.session),
            step: "hash_get_session",
          });
          if (hashSessionData.session) {
            router.replace("/dashboard");
            return;
          }
          router.replace(
            "/auth?error=callback_failed&error_description=hash_present_but_no_session"
          );
          return;
        }

        const hasSearch = window.location.search.length > 0;
        const hasHash = hash.length > 0;
        router.replace(
          `/auth?error=callback_failed&error_description=${encodeURIComponent(
            `no_code_or_session|href=${window.location.href}|search=${window.location.search}|hash=${window.location.hash}|hasSearch=${hasSearch}|hasHash=${hasHash}`
          )}`
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
