"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowserClient, hasSupabaseBrowserConfig } from "../../lib/supabase/client";

type AuthGuardProps = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    let fallbackTimer: number | null = null;

    const checkAuth = async () => {
      if (!hasSupabaseBrowserConfig()) {
        router.replace("/auth");
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        router.replace("/auth");
        return;
      }

      const redirectToAuth = () => {
        if (!active) return;
        const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
        router.replace(`/auth${next}`);
      };
      const resolvePreferredName = (metadata: Record<string, unknown> | undefined) => {
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
      };
      const handlePostAuthRouting = (session: { user?: { user_metadata?: Record<string, unknown> } }) => {
        const preferredName = resolvePreferredName(session.user?.user_metadata);
        const isWelcomePage = pathname === "/welcome";

        if (!preferredName && !isWelcomePage) {
          router.replace("/welcome");
          return false;
        }

        if (preferredName && isWelcomePage) {
          router.replace("/dashboard");
          return false;
        }

        return true;
      };

      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (!active) return;

        if (session) {
          if (fallbackTimer) {
            window.clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }
          if (!handlePostAuthRouting(session)) return;
          setReady(true);
          return;
        }

        if (event === "SIGNED_OUT") {
          setReady(false);
          redirectToAuth();
        }
      });
      const cleanup = () => {
        listener.subscription.unsubscribe();
      };

      const { data } = await supabase.auth.getSession();
      if (!active) {
        cleanup();
        return undefined;
      }

      if (data.session) {
        if (!handlePostAuthRouting(data.session)) {
          return cleanup;
        }
        setReady(true);
        return cleanup;
      }

      // Allow brief time for OAuth callback session hydration before redirect.
      fallbackTimer = window.setTimeout(() => {
        redirectToAuth();
      }, 800);

      return cleanup;
    };

    let unsubscribe: (() => void) | undefined;
    void checkAuth().then((cleanup) => {
      unsubscribe = cleanup;
    });

    return () => {
      active = false;
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [router, pathname]);

  if (!ready) {
    return (
      <section className="min-h-screen px-6 py-10 text-[var(--ink)]">
        <div className="aurora" />
        <div className="grain" />
        <div className="mx-auto max-w-[520px] rounded-[var(--r-lg)] border border-[var(--glass-border)] bg-[var(--glass-strong)] p-6 shadow-sm backdrop-blur">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
            Langslate AI
          </p>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">Checking session...</p>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
