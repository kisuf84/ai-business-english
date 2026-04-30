"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Button from "../../../components/shared/Button";
import Input from "../../../components/shared/Input";
import Select from "../../../components/shared/Select";
import Card from "../../../components/shared/Card";
import LessonLibraryList from "../../../components/lesson/LessonLibraryList";
import type { LessonRecord } from "../../../types/lesson";

export default function LessonsPage() {
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const loadLessons = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/lesson/list", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | LessonRecord[]
          | null;
        if (!response.ok || !Array.isArray(payload)) {
          throw new Error(
            payload && !Array.isArray(payload) && payload.error
              ? payload.error
              : "We could not load lessons right now."
          );
        }
        setLessons(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "We could not load lessons right now.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadLessons();
  }, []);

  const filteredLessons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return lessons.filter((lesson) => {
      if (!showArchived && lesson.status === "archived") return false;
      if (levelFilter && lesson.level !== levelFilter) return false;
      if (normalizedQuery) {
        const haystack = `${lesson.title} ${lesson.topic}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });
  }, [lessons, showArchived, levelFilter, query]);

  return (
    <section className="py-10">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Lesson Library
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            Your lessons
          </h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Search, filter, and access saved lessons.
          </p>
        </div>

        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="q" className="text-sm font-medium">
                Search
              </label>
              <Input
                id="q"
                name="q"
                placeholder="Search by title or topic"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="level" className="text-sm font-medium">
                Level
              </label>
              <Select
                id="level"
                name="level"
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.target.value)}
              >
                <option value="">All levels</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--ink-muted)] md:col-span-2">
              <input
                type="checkbox"
                name="showArchived"
                checked={showArchived}
                onChange={(event) => setShowArchived(event.target.checked)}
              />
              Show archived lessons
            </label>
          </div>
        </Card>

        {error ? <p className="mt-4 text-sm text-[var(--accent-warm)]">{error}</p> : null}

        {!error && !isLoading && lessons.length === 0 ? (
          <Card className="mt-6">
            <h2 className="font-serif text-2xl text-[var(--ink)]">No lessons yet</h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Create your first lesson to get started.
            </p>
            <Link href="/lesson/new" className="mt-4 inline-flex">
              <Button className="rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-4 py-2 text-xs font-semibold text-[#0c0b0a] hover:bg-[#d4ad55]">
                Create a lesson
              </Button>
            </Link>
          </Card>
        ) : null}

        {!error && !isLoading && lessons.length > 0 ? (
          <LessonLibraryList initialLessons={filteredLessons} />
        ) : null}
      </div>
    </section>
  );
}
