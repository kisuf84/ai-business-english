"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "../../../components/shared/Button";
import Input from "../../../components/shared/Input";
import Select from "../../../components/shared/Select";
import Card from "../../../components/shared/Card";
import type { CourseGenerationInput, CourseRecord } from "../../../types/course";

const initialForm: CourseGenerationInput = {
  topic: "",
  level: "",
  industry: "",
  profession: "",
  number_of_modules: 4,
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toLocaleDateString();
}

export default function CoursesPage() {
  const [form, setForm] = useState<CourseGenerationInput>(initialForm);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/course/list");
      if (!response.ok) {
        throw new Error("load_failed");
      }
      const data = (await response.json()) as unknown;
      setCourses(Array.isArray(data) ? (data as CourseRecord[]) : []);
    } catch {
      setError("We could not load courses right now.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
  }, []);

  const handleChange = (
    field: keyof CourseGenerationInput,
    value: string | number
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/course/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          industry: form.industry?.trim() || undefined,
          profession: form.profession?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("generate_failed");
      }

      await loadCourses();
    } catch {
      setError("We could not generate the course.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-10">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Course Generator
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            Build a structured Business English course
          </h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Create a full course outline in minutes and save it for later use.
          </p>
        </div>

        <Card>
          <form onSubmit={handleGenerate}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="topic" className="text-sm font-medium">
                  Topic
                </label>
                <Input
                  id="topic"
                  placeholder="e.g. Client communication"
                  value={form.topic}
                  onChange={(event) => handleChange("topic", event.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="level" className="text-sm font-medium">
                  Level
                </label>
                <Select
                  id="level"
                  value={form.level}
                  onChange={(event) => handleChange("level", event.target.value)}
                  required
                >
                  <option value="">Select level</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                </Select>
              </div>

              <div className="grid gap-2">
                <label htmlFor="industry" className="text-sm font-medium">
                  Industry (optional)
                </label>
                <Input
                  id="industry"
                  placeholder="e.g. Finance"
                  value={form.industry}
                  onChange={(event) => handleChange("industry", event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="profession" className="text-sm font-medium">
                  Profession (optional)
                </label>
                <Input
                  id="profession"
                  placeholder="e.g. Account Manager"
                  value={form.profession}
                  onChange={(event) =>
                    handleChange("profession", event.target.value)
                  }
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="number_of_modules" className="text-sm font-medium">
                  Number of modules
                </label>
                <Input
                  id="number_of_modules"
                  type="number"
                  min={1}
                  max={12}
                  value={form.number_of_modules}
                  onChange={(event) =>
                    handleChange(
                      "number_of_modules",
                      Math.max(1, Number(event.target.value) || 1)
                    )
                  }
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-5 py-2 text-xs font-semibold text-[#0c0b0a] hover:bg-[#d4ad55]"
                >
                  {isLoading ? "Generating..." : "Generate Course"}
                </Button>
                {error ? (
                  <p className="text-xs text-[var(--accent-warm)]">{error}</p>
                ) : null}
              </div>
            </div>
          </form>
        </Card>

        <div className="mt-8">
          <h2 className="font-serif text-2xl text-[var(--ink)]">
            Saved Courses
          </h2>

          {isLoading ? (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">
              Loading courses...
            </p>
          ) : null}

          {!isLoading && courses.length === 0 ? (
            <Card className="mt-4">
              <h3 className="font-serif text-xl text-[var(--ink)]">
                No courses yet
              </h3>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                Create your first course to get started.
              </p>
            </Card>
          ) : null}

          {!isLoading && courses.length > 0 ? (
            <div className="mt-4 grid gap-4">
              {courses.map((course) => (
                <Card key={course.id} className="rounded-3xl p-6">
                  <Link href={`/courses/${course.id}`}>
                    <div>
                      <strong className="text-lg text-[var(--ink)]">
                        {course.title}
                      </strong>
                      <p className="mt-2 text-sm text-[var(--ink-muted)]">
                        {course.topic}
                      </p>
                      <p className="text-sm text-[var(--ink-muted)]">
                        Level: {course.level}
                        {course.industry ? ` • ${course.industry}` : ""}
                      </p>
                      <p className="mt-2 text-xs text-[var(--ink-faint)]">
                        Created: {formatDate(course.created_at)}
                      </p>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
