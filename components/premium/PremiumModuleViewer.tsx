"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PremiumCourse, PremiumModule } from "../../lib/premiumClasses";

type PremiumModuleViewerProps = {
  course: PremiumCourse;
  module: PremiumModule;
  previousModule: PremiumModule | null;
  nextModule: PremiumModule | null;
};

export default function PremiumModuleViewer({
  course,
  module,
  previousModule,
  nextModule,
}: PremiumModuleViewerProps) {
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    if (!isFocusMode) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFocusMode(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFocusMode]);

  if (module.isLocked) {
    return (
      <div className="space-y-6">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-card)] p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
              {course.title}
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
              Module {module.number}
            </span>
            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
              Locked
            </span>
          </div>

          <h2 className="mt-5 font-serif text-3xl text-[var(--ink)]">
            Premium access required
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">
            This module is intentionally protected in Phase 2A. Preview access is
            limited to Module 1, and direct URLs for locked modules do not expose
            the HTML content.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/premium-classes/${course.slug}`}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-card)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-raised)]"
            >
              Back to Course
            </Link>
            <Link
              href="/premium-classes"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-4 py-3 text-sm font-semibold text-[#0c0b0a] transition hover:bg-[#d4ad55]"
            >
              View Premium Classes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const frame = (
    <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
      <iframe
        title={module.title}
        src={module.iframeSrc}
        className="h-[75vh] min-h-[520px] w-full border-0 md:h-[82vh] xl:h-[calc(100vh-220px)]"
      />
    </div>
  );

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-[28px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
              {course.title}
            </span>
            <span className="rounded-full border border-[var(--accent-gold)] bg-[var(--accent-gold-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--ink)]">
              Preview module
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
              Module {module.number} of {course.moduleCount}
            </span>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="mobile-safe-wrap text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
                {module.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ink-muted)]">
                Clean reading mode is available below. Focus mode expands the
                module into a fullscreen overlay and can be dismissed with the
                button or the Escape key.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsFocusMode(true)}
                className="inline-flex items-center justify-center rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-4 py-3 text-sm font-semibold text-[#0c0b0a] transition hover:bg-[#d4ad55]"
              >
                Enter focus mode
              </button>
              <Link
                href={`/premium-classes/${course.slug}`}
                className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-card)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-raised)]"
              >
                Back to Course
              </Link>
            </div>
          </div>
        </div>

        <div className="w-full">{frame}</div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {previousModule && !previousModule.isLocked ? (
            <Link
              href={`/premium-classes/${course.slug}/${previousModule.slug}`}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-card)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-raised)]"
            >
              Previous: Module {previousModule.number}
            </Link>
          ) : (
            <div className="hidden sm:block" />
          )}

          {nextModule ? (
            nextModule.isLocked ? (
              <div className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-card)] px-4 py-3 text-sm font-semibold text-[var(--ink-faint)]">
                Next: Module {nextModule.number} is locked
              </div>
            ) : (
              <Link
                href={`/premium-classes/${course.slug}/${nextModule.slug}`}
                className="inline-flex items-center justify-center rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-4 py-3 text-sm font-semibold text-[#0c0b0a] transition hover:bg-[#d4ad55]"
              >
                Next: Module {nextModule.number}
              </Link>
            )
          ) : null}
        </div>
      </div>

      {isFocusMode ? (
        <div className="fixed inset-0 z-50 bg-[rgba(5,9,18,0.94)] px-3 py-3 sm:px-5 sm:py-5">
          <div className="flex h-full flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-[rgba(8,14,26,0.92)] px-4 py-3 text-white backdrop-blur">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.14em] text-white/60">
                  Focus mode
                </p>
                <p className="mobile-safe-wrap mt-1 text-sm font-semibold text-white sm:text-base">
                  {module.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFocusMode(false)}
                className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Exit focus mode
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-[26px] border border-white/10 bg-white">
              <iframe
                title={`${module.title} focus mode`}
                src={module.iframeSrc}
                className="h-full min-h-0 w-full border-0"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
