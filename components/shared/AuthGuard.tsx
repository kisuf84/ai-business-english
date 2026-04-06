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

      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (!active) return;

        if (session) {
          if (fallbackTimer) {
            window.clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }
          setReady(true);
          return;
        }

        if (event === "SIGNED_OUT") {
          redirectToAuth();
        }
      });

      const { data } = await supabase.auth.getSession();
      if (!active) {
        listener.subscription.unsubscribe();
        return;
      }

      if (data.session) {
        setReady(true);
        return;
      }

      // Allow brief time for OAuth callback session hydration before redirect.
      fallbackTimer = window.setTimeout(() => {
        redirectToAuth();
      }, 800);

      return () => {
        listener.subscription.unsubscribe();
      };
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
      <section className="py-10">
        <div className="mx-auto max-w-[960px] rounded-[28px] border border-[var(--border)] bg-[var(--surface-card)] p-8 shadow-sm">
          <p className="text-sm text-[var(--ink-muted)]">Checking session...</p>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
