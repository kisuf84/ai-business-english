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
  lessonCount: number;
  thumbnailSrc: string;
};

const INITIAL_VISIBLE_COUNT = 24;
const GRADIENTS = [
  "linear-gradient(120deg,#2f7bff,#1d3fe0)",
  "linear-gradient(120deg,#10b981,#059669)",
  "linear-gradient(120deg,#7fb0ff,#2f7bff)",
  "linear-gradient(120deg,#34d399,#10b981)",
  "linear-gradient(120deg,#1d3fe0,#0a1330)",
  "linear-gradient(120deg,#2f7bff,#34d399)",
  "linear-gradient(120deg,#0a1330,#1d3fe0)",
  "linear-gradient(120deg,#059669,#2f7bff)",
];

function hashStr(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function gradientFor(name: string) {
  return GRADIENTS[hashStr(name) % GRADIENTS.length];
}

function initialsFor(name: string) {
  const words = name.replace(/[()&-]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function estimateMinutes(lessonCount: number) {
  return lessonCount * 14;
}

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
                <div
                  className="relative aspect-[3/2] overflow-hidden bg-[var(--paper-soft)]"
                  style={{ background: gradientFor(item.label) }}
                >
                  <span
                    className="absolute inset-0 flex items-center justify-center text-3xl font-extrabold text-white/90"
                    aria-hidden="true"
                  >
                    {initialsFor(item.label)}
                  </span>
                  <img
                    src={item.thumbnailSrc}
                    alt=""
                    width={1200}
                    height={800}
                    className="relative h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                  <span className="absolute right-3 top-3 rounded-full border border-emerald-300/40 bg-slate-950/75 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-emerald-300 backdrop-blur-sm">
                    {item.lessonCount > 0 ? "Live" : "Soon"}
                  </span>
                </div>
                <div className="flex min-h-[132px] flex-col gap-3 p-4 sm:p-5">
                  <div className="min-w-0">
                  <h2 className="mobile-safe-wrap text-base font-semibold leading-snug text-[var(--ink)]">{item.label}</h2>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    {item.meta} · {estimateMinutes(item.lessonCount).toLocaleString("en-US")} min
                  </p>
                  </div>
                  <div className="mt-auto h-1.5 overflow-hidden rounded-full bg-[var(--surface-raised)]">
                    <div className="h-full rounded-full bg-[var(--ink-faint)]" style={{ width: 0 }} />
                  </div>
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
