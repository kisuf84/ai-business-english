"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "../../../components/shared/Button";
import Card from "../../../components/shared/Card";
import Input from "../../../components/shared/Input";
import Select from "../../../components/shared/Select";
import Textarea from "../../../components/shared/Textarea";
import LessonViewer from "../../../components/lesson/LessonViewer";
import type {
  LessonGenerationApiError,
  LessonGenerationApiResponse,
  LessonGenerationInput,
  LessonGenerationOutput,
} from "../../../types/lesson";
import type { CourseGenerationInput, CourseRecord } from "../../../types/course";
import { parseYouTubeVideoId } from "../../../lib/youtube/url";
import { validateLessonOutputPayload } from "../../../lib/validators/lesson";

type GeneratorMode = "lesson" | "course";
type LessonGenerationStage =
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
  | "email_submitted"
  | "needs_transcript"
  | "ready"
  | "failed";

const YOUTUBE_EXTENDED_DELAY_MS = 7000;
const YOUTUBE_NEEDS_TRANSCRIPT_MIN_DELAY_MS = 7000;

const initialLessonForm: LessonGenerationInput = {
  topic: "",
  source_url: "",
  level: "",
  industry: "",
  profession: "",
  lesson_type: "",
};

const initialCourseForm: CourseGenerationInput = {
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

import type { VocabularyItem, LessonQuestion } from "../../../types/lesson";

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

function normalizeLessonOutput(raw: unknown): LessonGenerationApiResponse | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

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

function isTranscriptFailureCode(value: string | null): boolean {
  return (
    value === "no_captions" ||
    value === "captions_disabled" ||
    value === "unsupported_video" ||
    value === "transcript_fetch_failed" ||
    value === "unknown_error"
  );
}

function getTranscriptFallbackMessage(code: string | null, apiMessage: string | null) {
  if (code === "no_captions") {
    return "Have a transcript? Paste it to speed things up.";
  }

  if (code === "captions_disabled") {
    return "Have a transcript? Paste it to speed things up.";
  }

  if (code === "unsupported_video") {
    return "Have a transcript? Paste it to speed things up.";
  }

  if (code === "transcript_fetch_failed") {
    return "Have a transcript? Paste it to speed things up.";
  }

  return apiMessage || "Have a transcript? Paste it to speed things up.";
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function GeneratorPage() {
  const router = useRouter();
  const [mode, setMode] = useState<GeneratorMode>("lesson");

  const [lessonForm, setLessonForm] =
    useState<LessonGenerationInput>(initialLessonForm);
  const [lessonResult, setLessonResult] = useState<LessonGenerationOutput | null>(
    null
  );
  const [isLessonGenerating, setIsLessonGenerating] = useState(false);
  const [isLessonSaving, setIsLessonSaving] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [lessonDiagnostics, setLessonDiagnostics] = useState<string[]>([]);
  const [lessonStage, setLessonStage] = useState<LessonGenerationStage>("idle");
  const [youtubeGenerationState, setYoutubeGenerationState] =
    useState<YouTubeGenerationState>("idle");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [isNotificationSaving, setIsNotificationSaving] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<
    "idle" | "saved" | "error"
  >("idle");
  const [manualTranscript, setManualTranscript] = useState("");

  const [courseForm, setCourseForm] =
    useState<CourseGenerationInput>(initialCourseForm);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [isCourseLoading, setIsCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [coursesLoaded, setCoursesLoaded] = useState(false);

  const loadCourses = async () => {
    setIsCourseLoading(true);
    setCourseError(null);

    try {
      const response = await fetch("/api/course/list");
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "load_failed");
      }
      const data = (await response.json()) as unknown;
      setCourses(Array.isArray(data) ? (data as CourseRecord[]) : []);
      setCoursesLoaded(true);
    } catch (error) {
      setCourseError(
        error instanceof Error && error.message !== "load_failed"
          ? error.message
          : "We could not load courses right now."
      );
    } finally {
      setIsCourseLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "course" && !coursesLoaded) {
      void loadCourses();
    }
  }, [mode, coursesLoaded]);

  useEffect(() => {
    if (youtubeGenerationState !== "processing_initial") return;

    const timeout = window.setTimeout(() => {
      setYoutubeGenerationState((current) =>
        current === "processing_initial" ? "processing_extended" : current
      );
    }, YOUTUBE_EXTENDED_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [youtubeGenerationState]);

  const handleLessonChange = (
    field: keyof LessonGenerationInput,
    value: string
  ) => {
    setLessonForm((prev) => ({ ...prev, [field]: value }));
  };

  const runLessonGeneration = async () => {
    setIsLessonGenerating(true);
    setLessonError(null);
    setLessonDiagnostics([]);
    setLessonResult(null);
    setLessonStage("generating_lesson");
    setNotificationStatus("idle");

    try {
      const trimmedSourceUrl = lessonForm.source_url?.trim() || "";
      const trimmedManualTranscript = manualTranscript.trim();
      const isYouTubeGeneration = Boolean(trimmedSourceUrl && !trimmedManualTranscript);
      const generationStartedAt = Date.now();

      if (trimmedSourceUrl && !trimmedManualTranscript) {
        setYoutubeGenerationState("processing_initial");
        setLessonStage("validating_url");
        if (!parseYouTubeVideoId(trimmedSourceUrl)) {
          setLessonStage("generation_failed");
          setYoutubeGenerationState("failed");
          setLessonError("Please enter a valid YouTube URL.");
          return;
        }
        setLessonStage("extracting_transcript");
      } else {
        setYoutubeGenerationState("idle");
        setLessonStage("generating_lesson");
      }

      const maxAttempts = isYouTubeGeneration ? 2 : 1;
      let rawResult: unknown = null;

      for (let transcriptAttempt = 1; transcriptAttempt <= maxAttempts; transcriptAttempt += 1) {
        const response = await fetch("/api/lesson/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...lessonForm,
            source_url: lessonForm.source_url?.trim() || undefined,
            industry: lessonForm.industry?.trim() || undefined,
            profession: lessonForm.profession?.trim() || undefined,
            manual_source_text: trimmedManualTranscript || undefined,
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
          const errorCode =
            typeof apiPayload?.error_code === "string" ? apiPayload.error_code : null;
          const errorMessage =
            typeof apiPayload?.error === "string"
              ? apiPayload.error
              : typeof apiPayload?.message === "string"
                ? apiPayload.message
                : null;
          const detailItems = Array.isArray(apiPayload?.details)
            ? apiPayload.details.filter((item): item is string => typeof item === "string")
            : typeof apiPayload?.details === "string"
              ? [apiPayload.details]
              : [];
          const diagnostics =
            detailItems.length > 0
              ? [
                  ...(errorCode ? [`error_code: ${errorCode}`] : []),
                  ...detailItems,
                ]
              : [
                  ...(errorCode ? [`error_code: ${errorCode}`] : []),
                  ...(errorMessage ? [`message: ${errorMessage}`] : []),
                  "details: none provided by API",
                ];
          setLessonDiagnostics(diagnostics);
          if (isTranscriptFailureCode(errorCode)) {
            if (isYouTubeGeneration) {
              const elapsed = Date.now() - generationStartedAt;
              if (elapsed < YOUTUBE_NEEDS_TRANSCRIPT_MIN_DELAY_MS) {
                await wait(YOUTUBE_NEEDS_TRANSCRIPT_MIN_DELAY_MS - elapsed);
              }
            }
            setLessonStage("transcript_unavailable");
            setYoutubeGenerationState("needs_transcript");
            setLessonError(getTranscriptFallbackMessage(errorCode, errorMessage));
            return;
          }
          setLessonStage("generation_failed");
          setYoutubeGenerationState("failed");
          setLessonError(errorMessage || "We could not generate the lesson.");
          return;
        }

        rawResult = rawPayload;
        break;
      }

      setLessonStage("generating_lesson");
      const data = normalizeLessonOutput(rawResult);
      if (!data) {
        throw new Error("invalid_response");
      }
      setLessonResult(data);
      setYoutubeGenerationState(isYouTubeGeneration ? "ready" : "idle");
      setLessonStage("idle");
    } catch (error) {
      setLessonStage("generation_failed");
      setYoutubeGenerationState("failed");
      const message =
        error instanceof Error ? error.message : "We could not generate the lesson.";
      if (process.env.NODE_ENV !== "production") {
        setLessonDiagnostics((prev) => [
          ...prev,
          `client_error: ${message}`,
        ]);
      }
      setLessonError(
        process.env.NODE_ENV !== "production" ? message : "We could not generate the lesson."
      );
    } finally {
      setIsLessonGenerating(false);
    }
  };

  const handleNotificationCapture = async () => {
    const email = notificationEmail.trim();
    if (!email) {
      setNotificationStatus("error");
      return;
    }

    setIsNotificationSaving(true);
    setNotificationStatus("idle");
    try {
      const response = await fetch("/api/lesson/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source_url: lessonForm.source_url?.trim() || undefined,
          topic: lessonForm.topic?.trim() || undefined,
        }),
      });
      if (!response.ok) {
        throw new Error("notify_failed");
      }
      setYoutubeGenerationState("email_submitted");
      setNotificationStatus("saved");
    } catch {
      setNotificationStatus("error");
    } finally {
      setIsNotificationSaving(false);
    }
  };

  const handleLessonSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void runLessonGeneration();
  };

  const handleLessonSave = async () => {
    if (!lessonResult) return;
    setIsLessonSaving(true);
    setLessonError(null);

    try {
      const previewLesson = JSON.parse(
        JSON.stringify(lessonResult)
      ) as LessonGenerationOutput;
      const outputValidation = validateLessonOutputPayload(previewLesson);
      if (!outputValidation.ok) {
        setLessonError("Generated lesson is incomplete and cannot be saved yet.");
        return;
      }

      const response = await fetch("/api/lesson/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: {
            ...lessonForm,
            source_url: lessonForm.source_url?.trim() || undefined,
            industry: lessonForm.industry?.trim() || undefined,
            profession: lessonForm.profession?.trim() || undefined,
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
      setLessonError(
        message !== "save_failed" && message !== "invalid_response"
          ? message
          : "We couldn’t process your request. Try again."
      );
    } finally {
      setIsLessonSaving(false);
    }
  };

  const handleCourseChange = (
    field: keyof CourseGenerationInput,
    value: string | number
  ) => {
    setCourseForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCourseGenerate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setIsCourseLoading(true);
    setCourseError(null);

    try {
      const response = await fetch("/api/course/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...courseForm,
          industry: courseForm.industry?.trim() || undefined,
          profession: courseForm.profession?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; details?: string[] }
          | null;
        const details = Array.isArray(payload?.details)
          ? payload?.details.join(" ")
          : "";
        throw new Error(
          payload?.error
            ? `${payload.error}${details ? ` ${details}` : ""}`
            : "generate_failed"
        );
      }

      await loadCourses();
    } catch (error) {
      setCourseError(
        error instanceof Error && error.message !== "generate_failed"
          ? error.message
          : "We could not generate the course."
      );
    } finally {
      setIsCourseLoading(false);
    }
  };

  return (
    <section className="mobile-page-shell py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-8 sm:mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Generator
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            Generator
          </h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Generate structured lessons or full course outlines from one unified
            workspace.
          </p>
        </div>

        <div className="mb-6 flex w-full flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-1 sm:mb-8 sm:inline-flex sm:w-auto sm:gap-0">
          <button
            type="button"
            onClick={() => setMode("lesson")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition sm:min-w-[110px] sm:flex-none ${
              mode === "lesson"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--ink-muted)] hover:bg-[var(--surface-raised)]"
            }`}
          >
            Lesson
          </button>
          <button
            type="button"
            onClick={() => setMode("course")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition sm:min-w-[110px] sm:flex-none ${
              mode === "course"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--ink-muted)] hover:bg-[var(--surface-raised)]"
            }`}
          >
            Course
          </button>
        </div>

        <div className="min-h-[560px] sm:min-h-[760px]">
          {mode === "lesson" ? (
            <>
            <Card>
              <form onSubmit={handleLessonSubmit} action="" method="post">
                <div className="grid gap-4">
	                  <div className="grid gap-2">
                    <label htmlFor="topic" className="text-sm font-medium">
                      Topic
                    </label>
                    <Input
                      id="topic"
                      placeholder="e.g. Project kickoff meeting"
                      value={lessonForm.topic}
                      onChange={(event) =>
                        handleLessonChange("topic", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="source_url" className="text-sm font-medium">
                      Source URL (optional)
                    </label>
                    <Input
                      id="source_url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={lessonForm.source_url}
                      onChange={(event) =>
                        handleLessonChange("source_url", event.target.value)
                      }
                    />
                  </div>

                  {youtubeGenerationState === "needs_transcript" ||
                  manualTranscript.trim().length > 0 ? (
                    <div className="grid gap-2">
                      <label
                        htmlFor="manual_transcript"
                        className="text-sm font-medium"
                      >
                        Transcript
                      </label>
                      <Textarea
                        id="manual_transcript"
                        placeholder="Paste transcript text here..."
                        value={manualTranscript}
                        onChange={(event) => setManualTranscript(event.target.value)}
                        rows={8}
                      />
                      <p className="text-xs text-[var(--ink-faint)]">
                        Have a transcript? Paste it to speed things up.
                      </p>
                      {process.env.NODE_ENV !== "production" &&
                      lessonDiagnostics.length > 0 ? (
                        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                            Transcript debug (dev only)
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[var(--ink-muted)]">
                            {lessonDiagnostics.map((detail) => (
                              <li key={detail}>{detail}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <label htmlFor="level" className="text-sm font-medium">
                        Level
                      </label>
                      <Select
                        id="level"
                        value={lessonForm.level}
                        onChange={(event) =>
                          handleLessonChange("level", event.target.value)
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
                        value={lessonForm.industry}
                        onChange={(event) =>
                          handleLessonChange("industry", event.target.value)
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
                        value={lessonForm.profession}
                        onChange={(event) =>
                          handleLessonChange("profession", event.target.value)
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
                      value={lessonForm.lesson_type}
                      onChange={(event) =>
                        handleLessonChange("lesson_type", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      onClick={() => {
                        void runLessonGeneration();
                      }}
                      disabled={isLessonGenerating}
                      className="w-full rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-5 py-2 text-xs font-semibold text-[#0c0b0a] hover:bg-[#d4ad55] sm:w-auto"
                    >
                      {isLessonGenerating ? "Generating..." : "Generate Lesson"}
                    </Button>
                    {isLessonGenerating ? (
                      <div className="grid gap-2 text-xs text-[var(--ink-faint)]">
                        <p>
                          {youtubeGenerationState === "processing_extended"
                            ? "✨ Still working on your lesson..."
                            : youtubeGenerationState === "email_submitted"
                              ? "✨ Still working on your lesson..."
                            : youtubeGenerationState === "processing_initial"
                              ? "✨ Creating your lesson..."
                              : "Generating lesson..."}
                        </p>
                        {youtubeGenerationState === "email_submitted" ? (
                          <div className="grid max-w-sm gap-1">
                            <p className="font-medium text-[var(--ink)]">
                              ✅ You’re all set.
                            </p>
                            <p>We’ll send your lesson as soon as it’s ready.</p>
                            <p>You can leave this page — we’ve got it from here.</p>
                          </div>
                        ) : null}
                        {youtubeGenerationState === "processing_extended" ? (
                          <div className="grid max-w-sm gap-2">
                            <p>We’ll notify you when it’s ready.</p>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Input
                                type="email"
                                placeholder="Email address"
                                value={notificationEmail}
                                onChange={(event) => {
                                  setNotificationEmail(event.target.value);
                                  setNotificationStatus("idle");
                                }}
                                disabled={isNotificationSaving}
                              />
                              <Button
                                type="button"
                                onClick={handleNotificationCapture}
                                disabled={isNotificationSaving}
                                className="rounded-lg px-3 py-2 text-xs"
                              >
                                {isNotificationSaving ? "Saving..." : "Notify me"}
                              </Button>
                            </div>
                            {notificationStatus === "error" ? (
                              <p className="text-[var(--accent-warm)]">
                                Please enter a valid email address.
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {!isLessonGenerating &&
                    youtubeGenerationState === "needs_transcript" ? (
                      <p className="text-xs text-[var(--accent-warm)]">
                        Have a transcript? Paste it to speed things up.
                      </p>
                    ) : null}
                    {lessonError && youtubeGenerationState !== "needs_transcript" ? (
                      <p className="text-xs text-[var(--accent-warm)]">
                        {lessonError}
                      </p>
                    ) : null}
                  </div>
                </div>
              </form>
            </Card>

            {lessonResult ? (
              <div className="mt-8">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <h2 className="font-serif text-2xl text-[var(--ink)]">
                    Lesson Preview
                  </h2>
                  <Button
                    onClick={handleLessonSave}
                    disabled={isLessonSaving}
                    className="rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-4 py-2 text-xs font-semibold text-[#0c0b0a] hover:bg-[#d4ad55]"
                  >
                    {isLessonSaving ? "Saving..." : "Save Lesson"}
                  </Button>
                  {isLessonSaving ? (
                    <p className="text-xs text-[var(--ink-faint)]">
                      Saving lesson...
                    </p>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-[var(--ink-faint)]">
                  This lesson is a preview until you click Save Lesson.
                </p>

                <div className="mt-4">
                  <LessonViewer lesson={lessonResult} />
                </div>
              </div>
            ) : null}
            </>
          ) : (
            <>
            <Card>
              <form onSubmit={handleCourseGenerate}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="course_topic" className="text-sm font-medium">
                      Topic
                    </label>
                    <Input
                      id="course_topic"
                      placeholder="e.g. Client communication"
                      value={courseForm.topic}
                      onChange={(event) =>
                        handleCourseChange("topic", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="course_level" className="text-sm font-medium">
                      Level
                    </label>
                    <Select
                      id="course_level"
                      value={courseForm.level}
                      onChange={(event) =>
                        handleCourseChange("level", event.target.value)
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
                    <label
                      htmlFor="course_industry"
                      className="text-sm font-medium"
                    >
                      Industry (optional)
                    </label>
                    <Input
                      id="course_industry"
                      placeholder="e.g. Finance"
                      value={courseForm.industry}
                      onChange={(event) =>
                        handleCourseChange("industry", event.target.value)
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <label
                      htmlFor="course_profession"
                      className="text-sm font-medium"
                    >
                      Profession (optional)
                    </label>
                    <Input
                      id="course_profession"
                      placeholder="e.g. Account Manager"
                      value={courseForm.profession}
                      onChange={(event) =>
                        handleCourseChange("profession", event.target.value)
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <label
                      htmlFor="number_of_modules"
                      className="text-sm font-medium"
                    >
                      Number of modules
                    </label>
	                    <Input
	                      id="number_of_modules"
	                      type="number"
	                      min={1}
	                      max={12}
	                      value={courseForm.number_of_modules}
	                      onChange={(event) =>
	                        handleCourseChange(
	                          "number_of_modules",
	                          Math.max(1, Number(event.target.value) || 1)
	                        )
	                      }
	                    />
                  </div>

                <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <Button
                      type="submit"
                      disabled={isCourseLoading}
                      className="w-full rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-5 py-2 text-xs font-semibold text-[#0c0b0a] hover:bg-[#d4ad55] sm:w-auto"
                    >
                      {isCourseLoading ? "Generating..." : "Generate Course"}
                    </Button>
                    {courseError ? (
                      <p className="text-xs text-[var(--accent-warm)]">
                        {courseError}
                      </p>
                    ) : null}
                  </div>
                </div>
              </form>
            </Card>

            <div className="mt-8">
              <h2 className="font-serif text-2xl text-[var(--ink)]">
                Saved Courses
              </h2>

              {isCourseLoading ? (
                <p className="mt-3 text-sm text-[var(--ink-muted)]">
                  Loading courses...
                </p>
              ) : null}

              {!isCourseLoading && courses.length === 0 ? (
                <Card className="mt-4">
                  <h3 className="font-serif text-xl text-[var(--ink)]">
                    No courses yet
                  </h3>
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">
                    Create your first course to get started.
                  </p>
                </Card>
              ) : null}

              {!isCourseLoading && courses.length > 0 ? (
                <div className="mt-4 grid gap-4">
                  {courses.map((course) => (
                    <Card key={course.id} className="rounded-3xl p-5 sm:p-6">
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
            </>
          )}
        </div>
      </div>
    </section>
  );
}
