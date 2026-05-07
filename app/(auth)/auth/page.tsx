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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isConfigured] = useState(hasSupabaseBrowserConfig());
  const [nextPath, setNextPath] = useState("/dashboard");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/dashboard";
    const oauthError = params.get("error");
    const errorDescription = params.get("error_description");
    setNextPath(next);
    if (!oauthError) return;

    if (oauthError === "callback_failed") {
      setError(errorDescription || "Google sign-in failed. Please try again.");
    } else if (oauthError === "missing_supabase_config") {
      setError("Supabase auth is not configured correctly.");
    } else {
      setError(errorDescription || "Authentication failed. Please try again.");
    }
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
    setStatusMessage(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(
        "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }

    setIsGoogleLoading(true);
    setStatusMessage("Opening Google sign-in...");
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (signInError) {
      console.error("[google-oauth]", signInError);
      setError(signInError.message);
      setStatusMessage(null);
      setIsGoogleLoading(false);
    }
  };

  const handleMagicLinkLogin = async () => {
    setError(null);
    setStatusMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(
        "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }

    setIsMagicLinkLoading(true);
    const emailRedirectTo = `${window.location.origin}/auth/callback`;

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo,
      },
    });

    if (otpError) {
      setError(otpError.message || "We could not send the login link. Please try again.");
      setIsMagicLinkLoading(false);
      return;
    }

    setStatusMessage("Check your email for the login link.");
    setIsMagicLinkLoading(false);
  };

  return (
    <section className="min-h-screen overflow-x-hidden bg-[#080b12] text-slate-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <aside className="relative overflow-hidden border-b border-white/10 px-6 py-8 sm:px-10 sm:py-10 lg:border-b-0 lg:border-r lg:border-white/10 lg:px-14 lg:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(90,108,255,0.20),transparent_45%),radial-gradient(circle_at_85%_85%,rgba(56,189,248,0.14),transparent_38%)]" />
          <div className="relative z-10 mx-auto flex h-full w-full max-w-[560px] flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                LangslateAI
              </p>
              <h1 className="mt-5 text-balance text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Learn professional English from real-world content.
              </h1>
              <p className="mt-4 max-w-[44ch] text-sm leading-7 text-slate-300 sm:text-[15px]">
                Transform YouTube videos, articles, and business topics into
                structured AI-powered lessons.
              </p>

              <ul className="mt-8 space-y-3 text-sm text-slate-200">
                {[
                  "AI-generated CEFR-aligned lessons",
                  "Learn from YouTube and real-world content",
                  "Practice speaking, vocabulary, and simulations",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.35)] backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                Preview
              </p>
              <p className="mt-3 text-sm font-medium text-white">
                Weekly Business English Flow
              </p>
              <div className="mt-4 space-y-2 text-xs text-slate-300">
                <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  Source: YouTube Board Meeting Debrief
                </p>
                <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  Output: B2 lesson + speaking drills + quiz
                </p>
                <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  Focus: Professional vocabulary and fluency
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex items-center justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-14">
          <div className="w-full max-w-[460px]">
            <Card className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)] backdrop-blur sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Continue learning
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Welcome to Langslate AI</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Your professional English workspace is ready.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Generate lessons from YouTube videos, articles, and business topics.
                Practice vocabulary, speaking, simulations, and real-world communication.
              </p>

              {!isConfigured ? (
                <p className="mt-4 text-sm text-[var(--accent-warm)]">
                  Supabase auth is not configured. Add{" "}
                  <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                  <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your environment.
                </p>
              ) : null}

              <div className="mt-6">
                <Button
                  type="button"
                  onClick={() => void handleGoogleLogin()}
                  disabled={isGoogleLoading || isMagicLinkLoading || !isConfigured}
                  className="w-full rounded-xl border border-slate-200/20 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
                </Button>
              </div>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  or
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="grid gap-3">
                <input
                  type="email"
                  placeholder="Work email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isGoogleLoading || isMagicLinkLoading || !isConfigured}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 disabled:cursor-not-allowed disabled:text-slate-400"
                />
                <p className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                  Password login is not required. We will email you a secure login link.
                </p>
                <button
                  type="button"
                  onClick={() => void handleMagicLinkLogin()}
                  disabled={isGoogleLoading || isMagicLinkLoading || !isConfigured}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {isMagicLinkLoading ? "Sending..." : "Send login link"}
                </button>
              </div>

              {error ? (
                <p className="mt-4 text-sm text-[var(--accent-warm)]">{error}</p>
              ) : null}
              {!error && statusMessage ? (
                <p className="mt-4 text-sm text-slate-400">{statusMessage}</p>
              ) : null}
            </Card>

            <p className="mt-4 text-center text-xs text-slate-500">
              By continuing, you agree to your workspace access policy.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
