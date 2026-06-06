"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "../shared/Card";
import type { PremiumCourse } from "../../lib/premiumClasses";

type PremiumModuleListProps = {
  course: PremiumCourse;
};

export default function PremiumModuleList({ course }: PremiumModuleListProps) {
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);

  return (
    <>
      {lockedMessage ? (
        <Card className="mt-6 border-[var(--border-strong)] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[var(--ink)]">Premium access required</p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{lockedMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setLockedMessage(null)}
              className="lumen-focus rounded-full border border-[var(--border)] bg-[var(--glass)] px-4 py-2 text-xs font-bold text-[var(--ink-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
            >
              Dismiss
            </button>
          </div>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4">
        {course.modules.map((module) => {
          const isPreview = module.isPreview;
          const isLocked = module.isLocked;
          const card = (
            <Card
              className={`p-5 sm:p-6 ${
                !isLocked
                  ? "lumen-card-link"
                  : "opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="lumen-label">Module {module.number}</p>
                    {isLocked ? (
                      <span className="lumen-chip">Locked</span>
                    ) : isPreview ? (
                      <span className="lumen-chip">Preview</span>
                    ) : (
                      <span className="lumen-chip">Open</span>
                    )}
                  </div>
                  <h2 className="mobile-safe-wrap lumen-heading mt-2 text-xl leading-snug text-[var(--ink)]">
                    {module.title}
                  </h2>
                </div>
                <span className="lumen-secondary-action px-3 py-1 text-[11px]">
                  {isLocked ? "Locked" : "View"}
                </span>
              </div>
            </Card>
          );

          if (!isLocked) {
            return (
              <Link
                key={module.slug}
                href={`/premium-classes/${course.slug}/${module.slug}`}
                className="group block"
              >
                {card}
              </Link>
            );
          }

          return (
            <button
              key={module.slug}
              type="button"
              onClick={() =>
                setLockedMessage(
                  "This module is part of the premium course library. Module 1 is available as a free preview for now."
                )
              }
              className="block w-full text-left"
            >
              {card}
            </button>
          );
        })}
      </div>
    </>
  );
}
