"use client";

import { useEffect } from "react";

export default function AppGroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <section className="mobile-page-shell">
      <div className="lumen-page rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)] p-8 shadow-sm backdrop-blur">
        <p className="lumen-chip">
          Workspace
        </p>
        <h1 className="lumen-heading mt-4 text-3xl text-[var(--ink)]">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          We could not load this page right now.
        </p>
        <button
          type="button"
          onClick={reset}
          className="lumen-secondary-action mt-6"
        >
          Try again
        </button>
      </div>
    </section>
  );
}
