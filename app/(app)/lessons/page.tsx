import Link from "next/link";
import Button from "../../../components/shared/Button";
import Input from "../../../components/shared/Input";
import Select from "../../../components/shared/Select";
import Card from "../../../components/shared/Card";
import LessonLibraryList from "../../../components/lesson/LessonLibraryList";
import { listLessons } from "../../../lib/data/lessons";
import type { LessonRecord } from "../../../types/lesson";

type LessonsPageProps = {
  searchParams?: {
    q?: string;
    level?: string;
    showArchived?: string;
  };
};

export default async function LessonsPage({ searchParams }: LessonsPageProps) {
  let lessons: LessonRecord[] = [];
  let error: string | null = null;
  const query = searchParams?.q?.trim().toLowerCase() || "";
  const levelFilter = searchParams?.level?.trim() || "";
  const showArchived = searchParams?.showArchived === "1";

  try {
    lessons = await listLessons();
  } catch {
    error = "We could not load lessons right now.";
  }

  const filteredLessons = lessons.filter((lesson) => {
    if (!showArchived && lesson.status === "archived") {
      return false;
    }

    if (levelFilter && lesson.level !== levelFilter) {
      return false;
    }

    if (query) {
      const haystack = `${lesson.title} ${lesson.topic}`.toLowerCase();
      return haystack.includes(query);
    }

    return true;
  });

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
          <form>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="q" className="text-sm font-medium">
                  Search
                </label>
                <Input
                  id="q"
                  name="q"
                  placeholder="Search by title or topic"
                  defaultValue={searchParams?.q || ""}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="level" className="text-sm font-medium">
                  Level
                </label>
                <Select id="level" name="level" defaultValue={levelFilter}>
                  <option value="">All levels</option>
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
                  value="1"
                  defaultChecked={showArchived}
                />
                Show archived lessons
              </label>
              <div className="md:col-span-2">
                <Button type="submit" className="rounded-lg px-4 py-2 text-xs">
                  Apply filters
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {error ? (
          <p className="mt-4 text-sm text-[var(--accent-warm)]">{error}</p>
        ) : null}

        {!error && lessons.length === 0 ? (
          <Card className="mt-6">
            <h2 className="font-serif text-2xl text-[var(--ink)]">
              No lessons yet
            </h2>
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

        {!error && lessons.length > 0 ? (
          <LessonLibraryList initialLessons={filteredLessons} />
        ) : null}
      </div>
    </section>
  );
}
