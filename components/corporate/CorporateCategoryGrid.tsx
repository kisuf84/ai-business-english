"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Card from "../shared/Card";
import Input from "../shared/Input";

export type CorporateCategoryCard = {
  slug: string;
  label: string;
  href: string;
  meta: string;
  thumbnailSrc: string;
};

const INITIAL_VISIBLE_COUNT = 24;

/**
 * Category/program/profession grid for one Corporate family. Up to 128
 * entries, so: compact text cards (no per-category artwork yet), a
 * client-side name filter, and progressive "See more" instead of one wall.
 * The filter is local to this page and unrelated to Global Search.
 */
export default function CorporateCategoryGrid({
  items,
  nounSingular,
  nounPlural,
}: {
  items: CorporateCategoryCard[];
  nounSingular: string;
  nounPlural: string;
}) {
  const [query, setQuery] = useState("");
  const [revealed, setRevealed] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const filtered = useMemo(
    () => (isSearching ? items.filter((item) => item.label.toLowerCase().includes(normalizedQuery)) : items),
    [items, isSearching, normalizedQuery]
  );
  const visible = isSearching || revealed ? filtered : items.slice(0, INITIAL_VISIBLE_COUNT);
  const remaining = items.length - INITIAL_VISIBLE_COUNT;
  const searchId = `corporate-${nounPlural}-search`;

  return (
    <>
      {items.length > INITIAL_VISIBLE_COUNT / 2 ? (
        <Card className="mb-6 p-4 sm:p-5">
          <label
            htmlFor={searchId}
            className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]"
          >
            Search {nounPlural}
          </label>
          <Input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${nounPlural}...`}
            className="mt-3"
          />
        </Card>
      ) : null}

      {isSearching && filtered.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm font-semibold text-[var(--ink)]">No {nounPlural} found.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <Link key={item.slug} href={item.href} className="group block" aria-label={`${item.label} — ${item.meta}`}>
              <Card className="lumen-card-link h-full overflow-hidden p-0">
                <div className="aspect-[3/2] overflow-hidden bg-[var(--paper-soft)]">
                  <img
                    src={item.thumbnailSrc}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <h2 className="mobile-safe-wrap text-base font-semibold leading-snug text-[var(--ink)]">{item.label}</h2>
                    <p className="mt-1 text-xs text-[var(--ink-muted)]">{item.meta}</p>
                  </div>
                  <span aria-hidden="true" className="shrink-0 text-[var(--ink-faint)] transition group-hover:text-[var(--ink)]">
                    →
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!isSearching && !revealed && remaining > 0 ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="lumen-secondary-action px-5 py-2.5 text-sm font-semibold"
          >
            See more ({remaining} more {remaining === 1 ? nounSingular : nounPlural})
          </button>
        </div>
      ) : null}
    </>
  );
}
