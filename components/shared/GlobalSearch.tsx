"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "../../lib/api/authenticatedFetch";
import type { SearchResult } from "../../app/api/search/route";

const DEBOUNCE_MS = 300;

export default function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    debounceRef.current = window.setTimeout(async () => {
      try {
        const response = await authenticatedFetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`
        );
        if (requestId !== requestIdRef.current) return;

        if (!response.ok) {
          setResults([]);
          return;
        }

        const data = await response.json();
        if (requestId !== requestIdRef.current) return;
        setResults(Array.isArray(data.results) ? data.results : []);
      } catch {
        if (requestId === requestIdRef.current) {
          setResults([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setHasSearched(true);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelectResult = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    router.push(result.href);
  };

  const showPanel = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className="search w-full min-w-0">
      <label className="lumen-focus block">
        <span className="search-icon font-mono text-[11px] font-bold">
          /
        </span>
        <input
          type="search"
          placeholder="Search lessons, courses, resources"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </label>

      {showPanel ? (
        <div className="surface-panel-solid absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-y-auto rounded-[14px] p-2">
          {isLoading ? (
            <p className="px-3 py-4 text-xs text-[var(--ink-muted)]">Searching…</p>
          ) : results.length > 0 ? (
            <ul className="space-y-1">
              {results.map((result, index) => (
                <li key={`${result.type}-${result.href}-${index}`}>
                  <button
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="flex w-full flex-col items-start gap-0.5 rounded-[10px] px-3 py-2 text-left transition hover:bg-[var(--glass-strong)]"
                  >
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                      {result.typeLabel}
                    </span>
                    <span className="mobile-safe-wrap text-sm font-semibold text-[var(--ink)]">
                      {result.title}
                    </span>
                    {result.subtitle ? (
                      <span className="text-xs text-[var(--ink-muted)]">
                        {result.subtitle}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : hasSearched ? (
            <p className="px-3 py-4 text-xs text-[var(--ink-muted)]">
              No results for &quot;{query.trim()}&quot;.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
