"use client";

import { useMemo, useState } from "react";
import Card from "../../../components/shared/Card";
import Input from "../../../components/shared/Input";
import ContentCatalogSections, {
  type CatalogCardItem,
} from "../../../components/shared/ContentCatalogSections";

const INITIAL_VISIBLE_COUNT = 12;

/**
 * Brice's Aug 19 IA clarification: show only the first 12 of the 61
 * Business Industries cards up front, with a "See More" control revealing
 * the rest in place (no pagination route, all 61 stay reachable directly
 * and via search regardless of this UI state).
 *
 * The search box below is a lightweight client-side title filter only —
 * not related to Global Search (/api/search), which stays untouched. While
 * a query is active it searches all 61 titles and the See More control is
 * hidden (nothing left to "reveal" — filtered results are already complete).
 */
export default function BusinessIndustriesCatalog({ items }: { items: CatalogCardItem[] }) {
  const [revealed, setRevealed] = useState(false);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) return items;
    return items.filter((item) => item.title.toLowerCase().includes(normalizedQuery));
  }, [items, normalizedQuery]);

  const visibleItems = isSearching
    ? filteredItems
    : revealed
      ? items
      : items.slice(0, INITIAL_VISIBLE_COUNT);
  const remaining = items.length - INITIAL_VISIBLE_COUNT;

  return (
    <>
      <Card className="mb-6 p-4 sm:p-5">
        <label
          htmlFor="business-industries-search"
          className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]"
        >
          Search industries
        </label>
        <Input
          id="business-industries-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search industries..."
          className="mt-3"
        />
      </Card>

      {isSearching && visibleItems.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm font-semibold text-[var(--ink)]">No industries found.</p>
        </Card>
      ) : (
        <ContentCatalogSections
          groups={[
            {
              key: "all",
              label: "All Industries",
              items: visibleItems,
            },
          ]}
        />
      )}

      {!isSearching && !revealed && remaining > 0 ? (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="lumen-secondary-action px-5 py-2.5 text-sm font-semibold"
          >
            See More ({remaining} more industries)
          </button>
        </div>
      ) : null}
    </>
  );
}
