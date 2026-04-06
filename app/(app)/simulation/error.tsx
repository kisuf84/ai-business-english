"use client";

import { useEffect } from "react";

export default function SimulationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Simulation route error:", error);
  }, [error]);

  return (
    <section className="py-10">
      <div className="mx-auto max-w-[960px] rounded-[28px] border border-[var(--border)] bg-[var(--surface-card)] p-8 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
          Workplace Simulation
        </p>
        <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          We could not load the simulation right now.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[var(--surface-raised)] hover:shadow-md active:translate-y-0"
        >
          Try again
        </button>
      </div>
    </section>
  );
}
