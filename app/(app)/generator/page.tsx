"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../../../components/shared/Button";
import Card from "../../../components/shared/Card";
import Input from "../../../components/shared/Input";
import Select from "../../../components/shared/Select";
import Textarea from "../../../components/shared/Textarea";
import LessonViewer from "../../../components/lesson/LessonViewer";
import type {
  LessonGenerationApiError,
  LessonGenerationInput,
  LessonGenerationOutput,
} from "../../../types/lesson";
import { parseYouTubeVideoId } from "../../../lib/youtube/url";
import {
  normalizeLessonOutput,
  validateLessonOutputPayload,
} from "../../../lib/validators/lesson";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import { detectLessonSource } from "../../../lib/content/sourceDetection";

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
  | "needs_transcript"
  | "ready"
  | "failed";

type LoadingPhase = "generating" | "almost_there" | "fallback";

type YouTubeJobStatusPayload = {
  status?: string;
  lesson_url?: string | null;
  message?: string | null;
  error?: string;
};

const YOUTUBE_ALMOST_THERE_DELAY_MS = 6000;
const YOUTUBE_POLL_INTERVAL_MS = 2000;
const YOUTUBE_FALLBACK_DELAY_MS = 12000;

const initialLessonForm: LessonGenerationInput = {
  topic: "",
  source_url: "",
  source_text: "",
  level: "",
  industry: "",
  profession: "",
  lesson_type: "",
};

function isTranscriptFailureCode(value: string | null): boolean {
  return (
    value === "transcript_unavailable" ||
    value === "no_captions" ||
    value === "captions_disabled" ||
    value === "unsupported_video" ||
    value === "transcript_fetch_failed" ||
    value === "unknown_error"
  );
}

function getTranscriptFallbackMessage(code: string | null, apiMessage: string | null) {
  if (code === "transcript_unavailable") {
    return "Transcript unavailable. Paste transcript text to continue.";
  }

  if (
    code === "no_captions" ||
    code === "captions_disabled" ||
    code === "unsupported_video" ||
    code === "transcript_fetch_failed"
  ) {
    return "Have a transcript? Paste it to speed things up.";
  }

  return apiMessage || "Have a transcript? Paste it to speed things up.";
}

function triggerYouTubeJobProcessing() {
  void fetch("/api/cron/process-youtube-jobs", {
    method: "GET",
    cache: "no-store",
    keepalive: true,
  }).catch((error) => {
    console.warn("[youtube-job] immediate processing trigger failed", error);
  });
}

export default function GeneratorPage() {
  const router = useRouter();

  const [lessonForm, setLessonForm] =
    useState<LessonGenerationInput>(initialLessonForm);
  const [sourceInput, setSourceInput] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");

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
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("generating");
  const [showFallback, setShowFallback] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatusUrl, setJobStatusUrl] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [notificationStatus, setNotificationStatus] = useState<
    "idle" | "error" | "submitted"
  >("idle");

  const pollingIntervalRef = useRef<number | null>(null);
  const almostThereTimeoutRef = useRef<number | null>(null);
  const fallbackTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const loadUserEmail = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active || !data.user?.email) return;
      setEmail((current) => current || data.user?.email || "");
    };

    void loadUserEmail();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
      }
      if (almostThereTimeoutRef.current) {
        window.clearTimeout(almostThereTimeoutRef.current);
      }
      if (fallbackTimeoutRef.current) {
        window.clearTimeout(fallbackTimeoutRef.current);
      }
    };
  }, []);

  const clearYoutubeTimers = () => {
    if (pollingIntervalRef.current) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (almostThereTimeoutRef.current) {
      window.clearTimeout(almostThereTimeoutRef.current);
      almostThereTimeoutRef.current = null;
    }
    if (fallbackTimeoutRef.current) {
      window.clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  };

  const handleLessonChange = (
    field: keyof LessonGenerationInput,
    value: string
  ) => {
    setLessonForm((prev) => ({ ...prev, [field]: value }));
  };

  const fetchYouTubeJobStatus = async (
    nextJobId: string
  ): Promise<YouTubeJobStatusPayload> => {
    const response = await fetch(`/api/youtube-jobs/${nextJobId}`, {
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | YouTubeJobStatusPayload
      | null;

    if (!response.ok) {
      throw new Error(payload?.error || "We couldn’t check your lesson status.");
    }

    return payload || {};
  };

  const handleYouTubeJobStatus = (payload: YouTubeJobStatusPayload): boolean => {
    if (payload.status === "ready" && payload.lesson_url) {
      clearYoutubeTimers();
      setYoutubeGenerationState("ready");
      setShowFallback(false);
      setIsLessonGenerating(false);
      setLessonStage("idle");
      router.push(payload.lesson_url);
      return true;
    }

    if (payload.status === "needs_transcript") {
      clearYoutubeTimers();
      setYoutubeGenerationState("needs_transcript");
      setShowFallback(false);
      setIsLessonGenerating(false);
      setLessonStage("transcript_unavailable");
      setLessonError("Transcript unavailable. Paste transcript text to continue.");
      return true;
    }

    if (payload.status === "failed") {
      throw new Error(payload.message || "We couldn’t finish this lesson automatically.");
    }

    return false;
  };

  const pollYouTubeJob = async (nextJobId: string) => {
    try {
      const payload = await fetchYouTubeJobStatus(nextJobId);
      handleYouTubeJobStatus(payload);
    } catch (pollError) {
      clearYoutubeTimers();
      const message =
        pollError instanceof Error
          ? pollError.message
          : "We couldn’t check your lesson status.";
      setLessonError(message);
      setLessonStage("generation_failed");
      setYoutubeGenerationState("failed");
      setIsLessonGenerating(false);
      if (process.env.NODE_ENV !== "production") {
        setLessonDiagnostics((prev) => [
          ...prev,
          `poll_error: ${message}`,
        ]);
      }
    }
  };

  const startYouTubePolling = (nextJobId: string) => {
    if (pollingIntervalRef.current) {
      window.clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = window.setInterval(() => {
      void pollYouTubeJob(nextJobId);
    }, YOUTUBE_POLL_INTERVAL_MS);
  };

  const startLoadingTimers = (nextJobId: string) => {
    if (almostThereTimeoutRef.current) {
      window.clearTimeout(almostThereTimeoutRef.current);
    }
    if (fallbackTimeoutRef.current) {
      window.clearTimeout(fallbackTimeoutRef.current);
    }

    almostThereTimeoutRef.current = window.setTimeout(() => {
      setLoadingPhase("almost_there");
      setYoutubeGenerationState((current) =>
        current === "processing_initial" ? "processing_extended" : current
      );
    }, YOUTUBE_ALMOST_THERE_DELAY_MS);

    fallbackTimeoutRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          const payload = await fetchYouTubeJobStatus(nextJobId);
          if (handleYouTubeJobStatus(payload)) return;

          setLoadingPhase("fallback");
          setShowFallback(true);
          setYoutubeGenerationState((current) =>
            current === "processing_initial" ? "processing_extended" : current
          );
        } catch (fallbackError) {
          clearYoutubeTimers();
          const message =
            fallbackError instanceof Error
              ? fallbackError.message
              : "We couldn’t check your lesson status.";
          setLessonError(message);
          setLessonStage("generation_failed");
          setYoutubeGenerationState("failed");
          setIsLessonGenerating(false);
        }
      })();
    }, YOUTUBE_FALLBACK_DELAY_MS);
  };

  const handleEmailWhenReady = async () => {
    if (!jobId) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setNotificationStatus("error");
      setLessonError("Enter an email address to get notified, or keep this page open.");
      return;
    }

    setNotificationStatus("idle");

    try {
      const response = await fetch(`/api/youtube-jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (!response.ok && response.status !== 404 && response.status !== 405) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "We couldn’t save your email.");
      }

      setNotificationStatus("submitted");
      setLessonError(null);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "We couldn’t save your email.";
      setNotificationStatus("error");
      setLessonError(message);
    }
  };

  const runLessonGeneration = async () => {
    if (isLessonGenerating) return;

    setIsLessonGenerating(true);
    setLessonError(null);
    setLessonDiagnostics([]);
    setLessonResult(null);
    setLessonStage("generating_lesson");

    setNotificationStatus("idle");
    setShowFallback(false);
    setLoadingPhase("generating");
    setYoutubeGenerationState("idle");
    clearYoutubeTimers();

    let isYouTubeAsyncFlow = false;

    try {
      const trimmedSourceInput = sourceInput.trim();
      const trimmedManualTranscript = manualTranscript.trim();
      const detectedSource = trimmedSourceInput
        ? detectLessonSource(trimmedSourceInput)
        : null;

      const sourceUrl =
        detectedSource?.type === "youtube_url" ||
        detectedSource?.type === "generic_url"
          ? detectedSource.normalizedUrl || trimmedSourceInput
          : "";

      isYouTubeAsyncFlow =
        Boolean(detectedSource?.type === "youtube_url") &&
        trimmedManualTranscript.length === 0;

      if (isYouTubeAsyncFlow) {
        setLoadingPhase("generating");
        setYoutubeGenerationState("processing_initial");
        setLessonStage("validating_url");

        if (!parseYouTubeVideoId(sourceUrl)) {
          setLessonStage("generation_failed");
          setYoutubeGenerationState("failed");
          setLessonError("Please enter a valid YouTube URL.");
          setIsLessonGenerating(false);
          return;
        }

        setLessonStage("extracting_transcript");

        const jobResponse = await fetch("/api/youtube-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...lessonForm,
            topic: lessonForm.topic?.trim(),
            source_url: sourceUrl,
            industry: lessonForm.industry?.trim() || undefined,
            profession: lessonForm.profession?.trim() || undefined,
          }),
        });

        const jobPayload = (await jobResponse.json().catch(() => null)) as
          | { error?: string; id?: string; status_url?: string }
          | null;

        if (!jobResponse.ok) {
          const message =
            jobPayload?.error || "We couldn’t start your lesson. Try again.";
          setLessonError(message);
          setLessonStage("generation_failed");
          setYoutubeGenerationState("failed");
          setIsLessonGenerating(false);
          return;
        }

        if (!jobPayload?.id) {
          throw new Error("We couldn’t start your lesson. Try again.");
        }

        setJobId(jobPayload.id);
        setJobStatusUrl(jobPayload.status_url || null);
        setLessonStage("generating_lesson");

        triggerYouTubeJobProcessing();
        startYouTubePolling(jobPayload.id);
        startLoadingTimers(jobPayload.id);
        return;
      }

      const response = await fetch("/api/lesson/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...lessonForm,
          topic: lessonForm.topic?.trim(),
          source_url: sourceUrl || undefined,
          source_text:
            detectedSource?.type === "raw_text" && !trimmedManualTranscript
              ? trimmedSourceInput
              : undefined,
          industry: lessonForm.industry?.trim() || undefined,
          profession: lessonForm.profession?.trim() || undefined,
          manual_source_text: trimmedManualTranscript || undefined,
          transcript_attempt: 1,
        }),
      });

      if (!response.ok) {
        const rawError = (await response.json().catch(() => null)) as unknown;
        const apiError =
          rawError && typeof rawError === "object"
            ? (rawError as LessonGenerationApiError)
            : null;

        const errorCode =
          typeof apiError?.error_code === "string" ? apiError.error_code : null;
        const errorMessage =
          typeof apiError?.error === "string"
            ? apiError.error
            : typeof apiError?.message === "string"
              ? apiError.message
              : "We could not generate the lesson.";

        const detailItems = Array.isArray(apiError?.details)
          ? apiError.details.filter((item): item is string => typeof item === "string")
          : [];

        if (process.env.NODE_ENV !== "production" && detailItems.length > 0) {
          setLessonDiagnostics(detailItems);
        }

        if (isTranscriptFailureCode(errorCode)) {
          setLessonStage("transcript_unavailable");
          setYoutubeGenerationState("needs_transcript");
          setLessonError(getTranscriptFallbackMessage(errorCode, errorMessage));
          setIsLessonGenerating(false);
          return;
        }

        setLessonStage("generation_failed");
        setLessonError(errorMessage);
        setIsLessonGenerating(false);
        return;
      }

      const rawData = (await response.json()) as unknown;
      const normalized = normalizeLessonOutput(rawData, { strict: true });
      if (!normalized.ok) {
        setLessonStage("generation_failed");
        setLessonError(
          "The lesson draft was malformed. Please generate again with clearer source text."
        );
        if (process.env.NODE_ENV !== "production") {
          setLessonDiagnostics(normalized.errors);
        }
        setIsLessonGenerating(false);
        return;
      }

      setLessonResult(normalized.data);
      setLessonStage("idle");
      setIsLessonGenerating(false);
    } catch (error) {
      clearYoutubeTimers();
      setLessonStage("generation_failed");
      setYoutubeGenerationState("failed");
      setLessonError("Unexpected server issue while generating the lesson.");
      if (process.env.NODE_ENV !== "production") {
        setLessonDiagnostics([
          error instanceof Error ? error.message : "unknown_generation_error",
        ]);
      }
      setIsLessonGenerating(false);
    } finally {
      if (!isYouTubeAsyncFlow && lessonStage !== "generating_lesson") {
        setIsLessonGenerating(false);
      }
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
      const outputValidation = validateLessonOutputPayload(lessonResult);
      if (!outputValidation.ok) {
        setLessonError("Generated lesson is incomplete and cannot be saved yet.");
        if (process.env.NODE_ENV !== "production") {
          setLessonDiagnostics(outputValidation.errors);
        }
        return;
      }

      const trimmedSourceInput = sourceInput.trim();
      const savedSource = trimmedSourceInput
        ? detectLessonSource(trimmedSourceInput)
        : null;

      const response = await fetch("/api/lesson/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: {
            ...lessonForm,
            topic: lessonForm.topic?.trim(),
            source_url:
              savedSource && savedSource.type !== "raw_text"
                ? savedSource.normalizedUrl || trimmedSourceInput
                : undefined,
            source_text:
              savedSource?.type === "raw_text"
                ? trimmedSourceInput
                : undefined,
            industry: lessonForm.industry?.trim() || undefined,
            profession: lessonForm.profession?.trim() || undefined,
          },
          output: lessonResult,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; details?: string[] }
          | null;
        setLessonError(payload?.error || "Lesson save failed. Please try again.");
        if (process.env.NODE_ENV !== "production" && Array.isArray(payload?.details)) {
          setLessonDiagnostics(payload.details);
        }
        return;
      }

      const data = (await response.json()) as
        | { lesson_id?: string; id?: string; lesson_url?: string }
        | null;

      const lessonId = data?.lesson_id || data?.id;
      const lessonUrl = data?.lesson_url;

      if (typeof lessonUrl === "string" && lessonUrl.startsWith("/lessons/")) {
        router.push(`${lessonUrl}?saved=1`);
        return;
      }

      if (typeof lessonId === "string") {
        router.push(`/lessons/${lessonId}?saved=1`);
        return;
      }

      setLessonError("Lesson save completed, but lesson link was missing.");
    } catch {
      setLessonError("Lesson save failed. Please try again.");
    } finally {
      setIsLessonSaving(false);
    }
  };

  return (
    <section className="mobile-page-shell py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-8 sm:mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Lesson Generator
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            Lesson Generator
          </h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Generate a structured Business English lesson from a topic, source
            link, or transcript.
          </p>
        </div>

        <div className="min-h-[560px] sm:min-h-[760px]">
          <Card>
            <form onSubmit={handleLessonSubmit} action="" method="post">
              <div className="grid min-h-[520px] gap-4">
                {isLessonGenerating && youtubeGenerationState !== "idle" ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">
                          {loadingPhase === "almost_there"
                            ? "We’re almost there..."
                            : "Generating your lesson..."}
                        </p>
                        <p className="text-xs text-[var(--ink-faint)]">
                          We are checking the video and preparing the lesson.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <fieldset
                  disabled={isLessonGenerating && youtubeGenerationState !== "idle"}
                  className={`grid gap-4 transition-all duration-300 ${
                    isLessonGenerating && youtubeGenerationState !== "idle"
                      ? "pointer-events-none opacity-45"
                      : "opacity-100"
                  }`}
                >
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
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="source_input" className="text-sm font-medium">
                      Source URL or text (optional)
                    </label>
                    <Textarea
                      id="source_input"
                      placeholder="Paste a YouTube link, article link, or source text"
                      value={sourceInput}
                      onChange={(event) => setSourceInput(event.target.value)}
                      rows={5}
                    />
                    <p className="text-xs text-[var(--ink-faint)]">
                      YouTube links use the transcript pipeline. Article links and
                      pasted text generate directly.
                    </p>
                  </div>

                  {youtubeGenerationState === "needs_transcript" ||
                  manualTranscript.trim().length > 0 ? (
                    <div className="grid gap-2">
                      <label htmlFor="manual_transcript" className="text-sm font-medium">
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
                </fieldset>

                {youtubeGenerationState === "idle" ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      disabled={isLessonGenerating}
                      className="w-full rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-5 py-2 text-xs font-semibold text-[#0c0b0a] hover:bg-[#d4ad55] sm:w-auto"
                    >
                      {isLessonGenerating ? "Generating..." : "Generate Lesson"}
                    </Button>
                    {lessonError ? (
                      <p className="text-xs text-[var(--accent-warm)]">{lessonError}</p>
                    ) : null}
                  </div>
                ) : null}

                {showFallback ? (
                  <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-4 transition-all duration-300">
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        We’re building your lesson. This might take a moment.
                      </p>
                      <p className="mt-1 text-xs text-[var(--ink-faint)]">
                        You can leave this page open while we keep checking, or add
                        an email address for the ready link.
                      </p>
                    </div>
                    <div className="grid gap-2 sm:max-w-md">
                      <label htmlFor="fallback_email" className="text-sm font-medium">
                        Email (optional)
                      </label>
                      <Input
                        id="fallback_email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setNotificationStatus("idle");
                          setLessonError(null);
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        onClick={handleEmailWhenReady}
                        className="w-full rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-5 py-2 text-xs font-semibold text-[#0c0b0a] hover:bg-[#d4ad55] sm:w-auto"
                      >
                        Get notified when it’s ready
                      </Button>
                      {jobStatusUrl ? (
                        <a
                          href={jobStatusUrl}
                          className="text-xs text-[var(--accent)] underline"
                        >
                          View lesson status
                        </a>
                      ) : null}
                    </div>
                    {notificationStatus === "submitted" ? (
                      <p className="text-xs font-medium text-[var(--ink)]">
                        Email saved. We will send the lesson link when it is ready.
                      </p>
                    ) : null}
                    {notificationStatus === "error" || lessonError ? (
                      <p className="text-xs text-[var(--accent-warm)]">
                        {lessonError || "Please enter a valid email address."}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {!isLessonGenerating &&
                youtubeGenerationState === "needs_transcript" ? (
                  <p className="text-xs text-[var(--accent-warm)]">
                    Have a transcript? Paste it to speed things up.
                  </p>
                ) : null}
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
                  <p className="text-xs text-[var(--ink-faint)]">Saving lesson...</p>
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
        </div>
      </div>
    </section>
  );
}
