"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../../../../components/shared/Button";
import Input from "../../../../components/shared/Input";
import Select from "../../../../components/shared/Select";
import Textarea from "../../../../components/shared/Textarea";
import LessonViewer from "../../../../components/lesson/LessonViewer";
import Card from "../../../../components/shared/Card";
import type {
  LessonGenerationApiError,
  LessonGenerationApiResponse,
  LessonGenerationInput,
  LessonGenerationOutput,
} from "../../../../types/lesson";
import { parseYouTubeVideoId } from "../../../../lib/youtube/url";
import { validateLessonOutputPayload } from "../../../../lib/validators/lesson";

const initialForm: LessonGenerationInput = {
  topic: "",
  source_url: "",
  level: "",
  industry: "",
  profession: "",
  lesson_type: "",
};

type GenerationStage =
  | "idle"
  | "validating_url"
  | "extracting_transcript"
  | "transcript_unavailable"
  | "generating_lesson"
  | "generation_failed";

import type { VocabularyItem, LessonQuestion } from "../../../../types/lesson";

function isVocabularyArray(value: unknown): value is VocabularyItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).term === "string" &&
        typeof (item as Record<string, unknown>).definition === "string"
    )
  );
}

function isQuestionArray(value: unknown): value is LessonQuestion[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (!item || typeof item !== "object") return false;
      const q = item as Record<string, unknown>;
      const options = Array.isArray(q.options) ? (q.options as unknown[]) : [];
      const normalizedCorrectIndex =
        typeof q.correct_index === "number"
          ? q.correct_index
          : typeof q.correct === "number"
            ? q.correct
            : -1;
      return (
        typeof q.id === "string" &&
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        options.every((o) => typeof o === "string") &&
        normalizedCorrectIndex >= 0 &&
        normalizedCorrectIndex < options.length
      );
    })
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function normalizeLessonResponse(raw: unknown): LessonGenerationApiResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (
    typeof data.title !== "string" ||
    typeof data.summary !== "string" ||
    !isStringArray(data.objectives) ||
    !isVocabularyArray(data.vocabulary) ||
    typeof data.reading_text !== "string" ||
    !isQuestionArray(data.comprehension_questions) ||
    !isQuestionArray(data.grammar_exercises) ||
    typeof data.role_play !== "string" ||
    !isQuestionArray(data.quiz)
  ) {
    return null;
  }

  const normalizeQuestion = (value: LessonQuestion): LessonQuestion => {
    const q = value as LessonQuestion & { correct?: number };
    return {
      ...q,
      correct_index:
        typeof q.correct_index === "number" ? q.correct_index : (q.correct as number),
    };
  };

  return {
    title: data.title,
    summary: data.summary,
    objectives: data.objectives,
    vocabulary: data.vocabulary,
    reading_text: data.reading_text,
    comprehension_questions: data.comprehension_questions.map(
      normalizeQuestion
    ),
    grammar_exercises: data.grammar_exercises.map(normalizeQuestion),
    role_play: data.role_play,
    quiz: data.quiz.map(normalizeQuestion),
    source_meta:
      data.source_meta && typeof data.source_meta === "object"
        ? (data.source_meta as LessonGenerationApiResponse["source_meta"])
        : undefined,
  };
}

export default function LessonNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<LessonGenerationInput>(initialForm);
  const [result, setResult] = useState<LessonGenerationOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationStage, setGenerationStage] = useState<GenerationStage>("idle");

  const handleChange = (
    field: keyof LessonGenerationInput,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setGenerationStage("generating_lesson");

    try {
      const trimmedSourceUrl = form.source_url?.trim() || "";
      if (trimmedSourceUrl) {
        setGenerationStage("validating_url");
        if (!parseYouTubeVideoId(trimmedSourceUrl)) {
          setGenerationStage("generation_failed");
          setError("Please provide a valid YouTube URL.");
          return;
        }
        setGenerationStage("extracting_transcript");
      } else {
        setGenerationStage("generating_lesson");
      }

      const response = await fetch("/api/lesson/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source_url: form.source_url?.trim() || undefined,
          industry: form.industry?.trim() || undefined,
          profession: form.profession?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const apiError = (await response.json().catch(() => null)) as
          | LessonGenerationApiError
          | null;
        if (apiError?.error_code === "transcript_unavailable") {
          setGenerationStage("transcript_unavailable");
          setError("Transcript unavailable for this video.");
          return;
        }
        setGenerationStage("generation_failed");
        setError(apiError?.error || "We could not generate the lesson.");
        return;
      }

      setGenerationStage("generating_lesson");
      const data = normalizeLessonResponse(await response.json());
      if (!data) {
        throw new Error("invalid_response");
      }
      setResult(data);
      setGenerationStage("idle");
    } catch {
      setGenerationStage("generation_failed");
      setError("We could not generate the lesson.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);
    setError(null);

    try {
      const previewLesson = JSON.parse(
        JSON.stringify(result)
      ) as LessonGenerationOutput;
      const outputValidation = validateLessonOutputPayload(previewLesson);
      if (!outputValidation.ok) {
        setError("Generated lesson is incomplete and cannot be saved yet.");
        return;
      }

      const response = await fetch("/api/lesson/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: {
            ...form,
            source_url: form.source_url?.trim() || undefined,
            industry: form.industry?.trim() || undefined,
            profession: form.profession?.trim() || undefined,
          },
          output: previewLesson,
        }),
      });

      if (!response.ok) {
        throw new Error("save_failed");
      }

      const data = (await response.json()) as { id: string };
      router.push(`/lessons/${data.id}?saved=1`);
    } catch {
      setError("We could not save the lesson.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="py-10">
      <div className="mx-auto max-w-[860px]">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Lesson Generator
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            Create a tailored Business English lesson
          </h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Provide a topic (or source link) and get a structured lesson in
            seconds.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="topic" className="text-sm font-medium">
                  Topic
                </label>
                <Input
                  id="topic"
                  placeholder="e.g. Project kickoff meeting"
                  value={form.topic}
                  onChange={(event) => handleChange("topic", event.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="source_url" className="text-sm font-medium">
                  Source URL (optional)
                </label>
                <Input
                  id="source_url"
                  placeholder="https://..."
                  value={form.source_url}
                  onChange={(event) =>
                    handleChange("source_url", event.target.value)
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="level" className="text-sm font-medium">
                    Level
                  </label>
                  <Select
                    id="level"
                    value={form.level}
                    onChange={(event) =>
                      handleChange("level", event.target.value)
                    }
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
                    placeholder="e.g. Software"
                    value={form.industry}
                    onChange={(event) =>
                      handleChange("industry", event.target.value)
                    }
                  />
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <label htmlFor="profession" className="text-sm font-medium">
                    Profession (optional)
                  </label>
                  <Input
                    id="profession"
                    placeholder="e.g. Product Manager"
                    value={form.profession}
                    onChange={(event) =>
                      handleChange("profession", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="lesson_type" className="text-sm font-medium">
                  Lesson Type
                </label>
                <Textarea
                  id="lesson_type"
                  placeholder="e.g. Meeting prep, presentation practice"
                  value={form.lesson_type}
                  onChange={(event) =>
                    handleChange("lesson_type", event.target.value)
                  }
                  required
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  disabled={isGenerating}
                  className="rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-5 py-2 text-xs font-semibold text-[#0c0b0a] hover:bg-[#d4ad55]"
                >
                  {isGenerating ? "Generating..." : "Generate Lesson"}
                </Button>
                {isGenerating ? (
                  <p className="text-xs text-[var(--ink-faint)]">
                    {generationStage === "validating_url"
                      ? "Validating URL..."
                      : generationStage === "extracting_transcript"
                        ? "Extracting transcript..."
                        : "Generating lesson..."}
                  </p>
                ) : null}
                {!isGenerating && generationStage === "transcript_unavailable" ? (
                  <p className="text-xs text-[var(--accent-warm)]">
                    Transcript unavailable
                  </p>
                ) : null}
                {error ? (
                  <p className="text-xs text-[var(--accent-warm)]">{error}</p>
                ) : null}
              </div>
            </div>
          </form>
        </Card>

        {result ? (
          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-serif text-2xl text-[var(--ink)]">
                Lesson Preview
              </h2>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-4 py-2 text-xs font-semibold text-[#0c0b0a] hover:bg-[#d4ad55]"
              >
                {isSaving ? "Saving..." : "Save Lesson"}
              </Button>
              {isSaving ? (
                <p className="text-xs text-[var(--ink-faint)]">
                  Saving lesson...
                </p>
              ) : null}
            </div>

            <div className="mt-4">
              <LessonViewer lesson={result} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
