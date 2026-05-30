"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "../../../components/shared/Card";
import Button from "../../../components/shared/Button";
import {
  getSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
} from "../../../lib/supabase/client";

function getAuthCallbackUrl() {
  return new URL("/auth/callback", window.location.origin).toString();
}

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
    const redirectTo = getAuthCallbackUrl();

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
    const emailRedirectTo = getAuthCallbackUrl();

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
    <section className="auth-shell auth-page min-h-screen overflow-x-hidden">
      <div className="auth-layout grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <aside className="auth-hero relative overflow-hidden border-b border-[var(--border)] px-6 py-8 sm:px-10 sm:py-10 lg:border-b-0 lg:border-r lg:px-14 lg:py-14">
          <div className="auth-hero-ambient pointer-events-none absolute inset-0" />
          <div className="relative z-10 mx-auto flex h-full w-full max-w-[560px] flex-col justify-between">
            <div>
              <p className="auth-kicker">
                Langslate AI
              </p>
              <h1 className="auth-title lumen-heading mt-5 text-balance text-4xl leading-tight sm:text-6xl">
                Learn professional English from real-world content.
              </h1>
              <p className="auth-copy mt-4 max-w-[44ch] text-sm leading-7 sm:text-[15px]">
                Transform YouTube videos, articles, and business topics into
                structured AI-powered lessons.
              </p>

              <ul className="auth-list mt-8 space-y-3 text-sm">
                {[
                  "AI-generated CEFR-aligned lessons",
                  "Learn from YouTube and real-world content",
                  "Practice speaking, vocabulary, and simulations",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-[image:var(--aurora-line)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="auth-preview lumen-panel mt-10 rounded-[var(--radius-lg)] p-5">
              <p className="auth-label font-mono text-xs font-bold uppercase tracking-[0.14em]">
                Preview
              </p>
              <p className="auth-preview-title mt-3 text-sm font-bold">
                Langslate MVP workspace
              </p>
              <div className="mt-4 space-y-2 text-xs">
                <p className="auth-preview-item px-3 py-2">
                  Generate lessons from topics, URLs, or transcripts
                </p>
                <p className="auth-preview-item px-3 py-2">
                  Save structured lessons to your private library
                </p>
                <p className="auth-preview-item px-3 py-2">
                  Practice workplace communication simulations
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex items-center justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-14">
          <div className="w-full max-w-[460px]">
            <Card className="auth-card p-6 sm:p-8">
              <p className="auth-kicker">
                Continue learning
              </p>
              <h2 className="auth-form-title mt-4 text-3xl">Welcome to Langslate AI</h2>
              <p className="auth-muted mt-2 text-sm leading-6">
                Your professional English workspace is ready.
              </p>
              <p className="auth-muted mt-2 text-sm leading-6">
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
                  className="auth-primary-button w-full px-5 py-3 text-sm font-extrabold disabled:opacity-70"
                >
                  {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
                </Button>
              </div>

              <div className="auth-divider my-6 flex items-center gap-3">
                <div className="h-px flex-1" />
                <span className="font-mono text-xs uppercase tracking-[0.12em]">
                  or
                </span>
                <div className="h-px flex-1" />
              </div>

              <div className="grid gap-3">
                <input
                  type="email"
                  placeholder="Work email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isGoogleLoading || isMagicLinkLoading || !isConfigured}
                  className="auth-input lumen-focus w-full rounded-[14px] border border-[var(--border)] bg-[var(--glass)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] disabled:cursor-not-allowed disabled:text-[var(--ink-faint)]"
                />
                <p className="auth-info text-sm">
                  Password login is not required. We will email you a secure login link.
                </p>
                <button
                  type="button"
                  onClick={() => void handleMagicLinkLogin()}
                  disabled={isGoogleLoading || isMagicLinkLoading || !isConfigured}
                  className="auth-secondary-button lumen-focus w-full rounded-full px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isMagicLinkLoading ? "Sending..." : "Send login link"}
                </button>
              </div>

              {error ? (
                <p className="auth-error mt-4 text-sm">{error}</p>
              ) : null}
              {!error && statusMessage ? (
                <p className="auth-muted mt-4 text-sm">{statusMessage}</p>
              ) : null}
            </Card>

            <p className="auth-footer mt-4 text-center text-xs">
              By continuing, you agree to your workspace access policy.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
