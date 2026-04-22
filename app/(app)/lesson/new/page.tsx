"use client";

import { useEffect, useState } from "react";
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
type YouTubeGenerationState =
  | "idle"
  | "processing_initial"
  | "processing_extended"
  | "needs_transcript"
  | "ready"
  | "failed";

const YOUTUBE_EXTENDED_DELAY_MS = 7000;
const YOUTUBE_NEEDS_TRANSCRIPT_MIN_DELAY_MS = 7000;

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

function isTranscriptFailureCode(value: string | undefined): boolean {
  return (
    value === "no_captions" ||
    value === "captions_disabled" ||
    value === "unsupported_video" ||
    value === "transcript_fetch_failed" ||
    value === "unknown_error"
  );
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function LessonNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<LessonGenerationInput>(initialForm);
  const [result, setResult] = useState<LessonGenerationOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationStage, setGenerationStage] = useState<GenerationStage>("idle");
  const [youtubeGenerationState, setYoutubeGenerationState] =
    useState<YouTubeGenerationState>("idle");
  const [jobStatusUrl, setJobStatusUrl] = useState<string | null>(null);

  useEffect(() => {
    if (youtubeGenerationState !== "processing_initial") return;

    const timeout = window.setTimeout(() => {
      setYoutubeGenerationState((current) =>
        current === "processing_initial" ? "processing_extended" : current
      );
    }, YOUTUBE_EXTENDED_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [youtubeGenerationState]);

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
      const isYouTubeGeneration = Boolean(trimmedSourceUrl);
      const generationStartedAt = Date.now();
      if (trimmedSourceUrl) {
        setYoutubeGenerationState("processing_initial");
        setGenerationStage("validating_url");
        if (!parseYouTubeVideoId(trimmedSourceUrl)) {
          setGenerationStage("generation_failed");
          setYoutubeGenerationState("failed");
          setError("Please enter a valid YouTube URL.");
          return;
        }
        setGenerationStage("extracting_transcript");

        const jobResponse = await fetch("/api/youtube-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            source_url: trimmedSourceUrl,
            industry: form.industry?.trim() || undefined,
            profession: form.profession?.trim() || undefined,
          }),
        });
        const jobPayload = (await jobResponse.json().catch(() => null)) as
          | { error?: string; status_url?: string }
          | null;
        if (!jobResponse.ok) {
          setGenerationStage("generation_failed");
          setYoutubeGenerationState("failed");
          setError(jobPayload?.error || "We couldn’t start your lesson. Try again.");
          return;
        }
        setJobStatusUrl(jobPayload?.status_url || null);
        if (jobPayload?.status_url) {
          router.push(jobPayload.status_url);
          return;
        }
        setYoutubeGenerationState("processing_extended");
        setGenerationStage("idle");
        return;
      } else {
        setYoutubeGenerationState("idle");
        setGenerationStage("generating_lesson");
      }

      const maxAttempts = isYouTubeGeneration ? 2 : 1;
      let rawResult: unknown = null;

      for (let transcriptAttempt = 1; transcriptAttempt <= maxAttempts; transcriptAttempt += 1) {
        const response = await fetch("/api/lesson/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            source_url: form.source_url?.trim() || undefined,
            industry: form.industry?.trim() || undefined,
            profession: form.profession?.trim() || undefined,
            transcript_attempt: transcriptAttempt,
          }),
        });

        const rawPayload = (await response.json().catch(() => null)) as unknown;
        const apiPayload =
          rawPayload && typeof rawPayload === "object"
            ? (rawPayload as LessonGenerationApiError)
            : null;

        if (response.ok && apiPayload?.status === "still_processing") {
          setYoutubeGenerationState("processing_extended");
          if (transcriptAttempt < maxAttempts) {
            await wait(2500);
            continue;
          }
        }

        if (!response.ok || apiPayload?.status === "needs_transcript") {
          if (isTranscriptFailureCode(apiPayload?.error_code)) {
            if (isYouTubeGeneration) {
              const elapsed = Date.now() - generationStartedAt;
              if (elapsed < YOUTUBE_NEEDS_TRANSCRIPT_MIN_DELAY_MS) {
                await wait(YOUTUBE_NEEDS_TRANSCRIPT_MIN_DELAY_MS - elapsed);
              }
            }
            setGenerationStage("transcript_unavailable");
            setYoutubeGenerationState("needs_transcript");
            setError("Have a transcript? Paste it to speed things up.");
            return;
          }
          setGenerationStage("generation_failed");
          setYoutubeGenerationState("failed");
          setError(apiPayload?.error || "We could not generate the lesson.");
          return;
        }

        rawResult = rawPayload;
        break;
      }

      setGenerationStage("generating_lesson");
      const data = normalizeLessonResponse(rawResult);
      if (!data) {
        throw new Error("invalid_response");
      }
      setResult(data);
      setYoutubeGenerationState(isYouTubeGeneration ? "ready" : "idle");
      setGenerationStage("idle");
    } catch {
      setGenerationStage("generation_failed");
      setYoutubeGenerationState("failed");
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
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "save_failed");
      }

      const data = (await response.json()) as unknown;
      if (
        !data ||
        typeof data !== "object" ||
        typeof (data as { id?: unknown }).id !== "string"
      ) {
        throw new Error("invalid_response");
      }
      const lessonId = (data as { id: string }).id;
      router.push(`/lessons/${lessonId}?saved=1`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "save_failed";
      setError(
        message !== "save_failed" && message !== "invalid_response"
          ? message
          : "We couldn’t process your request. Try again."
      );
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
                  <div className="grid gap-2 text-xs text-[var(--ink-faint)]">
                    <p>
                      {youtubeGenerationState === "processing_extended"
                        ? "✨ Still working on your lesson..."
                        : youtubeGenerationState === "processing_initial"
                          ? "✨ Creating your lesson..."
                          : "Generating lesson..."}
                    </p>
                    {youtubeGenerationState === "processing_extended" ? (
                      <div className="grid max-w-sm gap-2">
                        <p>This can take a little longer for some videos.</p>
                        {jobStatusUrl ? (
                          <a
                            href={jobStatusUrl}
                            className="text-[var(--accent)] underline"
                          >
                            View lesson status
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {!isGenerating && youtubeGenerationState === "needs_transcript" ? (
                  <p className="text-xs text-[var(--accent-warm)]">
                    Have a transcript? Paste it to speed things up.
                  </p>
                ) : null}
                {error && youtubeGenerationState !== "needs_transcript" ? (
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
