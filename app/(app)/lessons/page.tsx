"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Button from "../../../components/shared/Button";
import Input from "../../../components/shared/Input";
import Select from "../../../components/shared/Select";
import Card from "../../../components/shared/Card";
import LessonLibraryList from "../../../components/lesson/LessonLibraryList";
import { authenticatedFetch } from "../../../lib/api/authenticatedFetch";
import type { LessonRecord } from "../../../types/lesson";

export default function LessonsPage() {
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const loadLessons = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authenticatedFetch("/api/lesson/list", {
          cache: "no-store",
        });
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

  const handleDeleteLesson = async (id: string) => {
    if (deletingId) return;
    if (!window.confirm("Delete this lesson? This cannot be undone.")) return;
    setDeletingId(id);
    setError(null);
    try {
      const response = await authenticatedFetch("/api/lesson/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "We could not delete this lesson.");
      }
      setLessons((prev) => prev.filter((lesson) => lesson.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We could not delete this lesson."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mobile-page-shell">
      <div className="lumen-page">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="lumen-chip">
              Lesson Library
            </p>
            <h1 className="lumen-heading mt-4 text-balance text-4xl sm:text-5xl">
              Your lessons
            </h1>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">
              Search, filter, and access saved lessons.
            </p>
          </div>
          <Link
            href="/lesson/new"
            className="lumen-focus inline-flex w-full items-center justify-center rounded-full bg-[image:var(--aurora-line)] px-5 py-3 text-sm font-extrabold text-[var(--accent-ink)] shadow-glow transition hover:-translate-y-0.5 sm:w-auto"
          >
            New lesson
          </Link>
        </div>

        <Card className="p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="q" className="lumen-label">
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
              <label htmlFor="level" className="lumen-label">
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
            <label className="lumen-tile flex items-center gap-3 text-sm text-[var(--ink-muted)] md:col-span-2">
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
            <h2 className="lumen-heading text-3xl">No lessons yet</h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Create your first lesson to get started.
            </p>
            <Link href="/lesson/new" className="mt-4 inline-flex">
              <Button className="border-transparent bg-[image:var(--aurora-line)] text-[var(--accent-ink)]">
                Create a lesson
              </Button>
            </Link>
          </Card>
        ) : null}

        {!error && !isLoading && lessons.length > 0 ? (
          <LessonLibraryList
            lessons={filteredLessons}
            deletingId={deletingId}
            onDelete={handleDeleteLesson}
          />
        ) : null}
      </div>
    </section>
  );
}
