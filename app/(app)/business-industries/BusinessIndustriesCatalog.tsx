"use client";

import { useState } from "react";
import ContentCatalogSections, {
  type CatalogCardItem,
} from "../../../components/shared/ContentCatalogSections";

const INITIAL_VISIBLE_COUNT = 12;

/**
 * Brice's Aug 19 IA clarification: show only the first 12 of the 61
 * Business Industries cards up front, with a "See More" control revealing
 * the rest in place (no pagination route, all 61 stay reachable directly
 * and via search regardless of this UI state).
 */
export default function BusinessIndustriesCatalog({ items }: { items: CatalogCardItem[] }) {
  const [revealed, setRevealed] = useState(false);
  const visibleItems = revealed ? items : items.slice(0, INITIAL_VISIBLE_COUNT);
  const remaining = items.length - INITIAL_VISIBLE_COUNT;

  return (
    <>
      <ContentCatalogSections
        groups={[
          {
            key: "all",
            label: "All Industries",
            items: visibleItems,
          },
        ]}
      />
      {!revealed && remaining > 0 ? (
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
