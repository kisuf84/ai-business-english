"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import { authenticatedFetch } from "../../../lib/api/authenticatedFetch";
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
import { parseYouTubeVideoId } from "../../../lib/youtube/url";
import { validateLessonOutputPayload } from "../../../lib/validators/lesson";
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

const YOUTUBE_ALMOST_THERE_DELAY_MS = 6000;
const YOUTUBE_POLL_INTERVAL_MS = 2000;
const YOUTUBE_FALLBACK_DELAY_MS = 12000;
const GENERATION_PROGRESS_COPY = [
  {
    title: "Preparing your lesson...",
    detail: "We are organizing the brief and checking the required lesson structure.",
  },
  {
    title: "Analyzing your source...",
    detail: "We are reading the topic, source, or transcript before building activities.",
  },
  {
    title: "Generating structured activities...",
    detail: "We are creating vocabulary, reading, comprehension, grammar, role play, and quiz sections.",
  },
  {
    title: "Finalizing your lesson...",
    detail: "We are validating the lesson shape and preparing the preview.",
  },
];
const GENERATION_PROGRESS_DELAYS_MS = [0, 8000, 30000, 65000];

const initialLessonForm: LessonGenerationInput = {
  topic: "",
  source_url: "",
  level: "",
  industry: "",
  profession: "",
  lesson_type: "",
};

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
    !isVocabularyArray(data.word_bank) ||
    typeof data.reading_text !== "string" ||
    !isQuestionArray(data.reading_comprehension) ||
    !isQuestionArray(data.vocabulary_exercise) ||
    !isQuestionArray(data.grammar) ||
    !isQuestionArray(data.final_assessment)
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
    word_bank: data.word_bank,
    reading_text: data.reading_text,
    reading_comprehension: data.reading_comprehension.map(
      normalizeQuestion
    ),
    vocabulary_exercise: data.vocabulary_exercise.map(normalizeQuestion),
    grammar: data.grammar.map(normalizeQuestion),
    final_assessment: data.final_assessment.map(normalizeQuestion),
    listening: typeof data.listening === "string" ? data.listening : undefined,
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
  if (
    code === "no_captions" ||
    code === "captions_disabled" ||
    code === "unsupported_video" ||
    code === "transcript_fetch_failed"
  ) {
    return "We couldn’t access this video’s transcript automatically. It may be region-restricted, private, age-restricted, bot-protected, or have captions disabled. You can paste the transcript manually to continue.";
  }

  return (
    apiMessage ||
    "We couldn’t access this video’s transcript automatically. It may be region-restricted, private, age-restricted, bot-protected, or have captions disabled. You can paste the transcript manually to continue."
  );
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
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

type YouTubeJobStatusPayload = {
  status?: string;
  lesson_url?: string | null;
  message?: string | null;
  error?: string;
  last_error_code?: string | null;
  last_error_message?: string | null;
};

function getYouTubeLoadingCopy(
  lessonStage: LessonGenerationStage,
  youtubeState: YouTubeGenerationState,
  loadingPhase: LoadingPhase,
  progressIndex: number
) {
  const stagedCopy =
    GENERATION_PROGRESS_COPY[
      Math.min(Math.max(progressIndex, 0), GENERATION_PROGRESS_COPY.length - 1)
    ];

  if (lessonStage === "validating_url") {
    return {
      title: stagedCopy.title,
      detail: "We are validating the video link and creating the lesson job.",
    };
  }

  if (lessonStage === "extracting_transcript") {
    return {
      title: stagedCopy.title,
      detail: "We are checking available captions before building the lesson.",
    };
  }

  if (youtubeState === "processing_extended" || loadingPhase === "almost_there") {
    return {
      title: stagedCopy.title,
      detail:
        loadingPhase === "fallback"
          ? "This can take 60–90 seconds for longer sources. We are still checking for the finished lesson."
          : stagedCopy.detail,
    };
  }

  return stagedCopy;
}

export default function GeneratorPage() {
  const router = useRouter();

  const [lessonForm, setLessonForm] =
    useState<LessonGenerationInput>(initialLessonForm);
  const [sourceInput, setSourceInput] = useState("");
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("generating");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<
    "idle" | "error" | "submitted"
  >("idle");
  const [jobStatusUrl, setJobStatusUrl] = useState<string | null>(null);
  const [manualTranscript, setManualTranscript] = useState("");
  const [isRedirectingToLesson, setIsRedirectingToLesson] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);
  const almostThereTimeoutRef = useRef<number | null>(null);
  const fallbackTimeoutRef = useRef<number | null>(null);
  const readyRedirectTimeoutRef = useRef<number | null>(null);
  const generationProgressTimeoutsRef = useRef<number[]>([]);
  const [generationProgressIndex, setGenerationProgressIndex] = useState(0);

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
      if (readyRedirectTimeoutRef.current) {
        window.clearTimeout(readyRedirectTimeoutRef.current);
      }
      generationProgressTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      generationProgressTimeoutsRef.current = [];
    };
  }, []);

  const clearGenerationProgressTimers = () => {
    generationProgressTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    generationProgressTimeoutsRef.current = [];
  };

  const startGenerationProgressTimers = () => {
    clearGenerationProgressTimers();
    setGenerationProgressIndex(0);
    generationProgressTimeoutsRef.current = GENERATION_PROGRESS_DELAYS_MS.map(
      (delay, index) =>
        window.setTimeout(() => {
          setGenerationProgressIndex(index);
        }, delay)
    );
  };

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
    if (readyRedirectTimeoutRef.current) {
      window.clearTimeout(readyRedirectTimeoutRef.current);
      readyRedirectTimeoutRef.current = null;
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

  const handleYouTubeJobStatus = (
    payload: YouTubeJobStatusPayload
  ): boolean => {
    console.info("[youtube-job-status] payload", {
      status: payload.status ?? null,
      lastErrorCode: payload.last_error_code ?? null,
      hasLessonUrl: Boolean(payload.lesson_url),
    });

    if (payload.status === "ready" && payload.lesson_url) {
      clearYoutubeTimers();
      clearGenerationProgressTimers();
      setYoutubeGenerationState("ready");
      setIsGenerating(false);
      setIsLessonGenerating(false);
      setShowFallback(false);
      setIsRedirectingToLesson(true);
      readyRedirectTimeoutRef.current = window.setTimeout(() => {
        router.push(payload.lesson_url as string);
      }, 900);
      return true;
    }

    if (payload.status === "needs_transcript") {
      clearYoutubeTimers();
      clearGenerationProgressTimers();
      setIsGenerating(false);
      setIsLessonGenerating(false);
      setLessonStage("transcript_unavailable");
      setYoutubeGenerationState("needs_transcript");
      setLessonError(
        getTranscriptFallbackMessage(
          payload.last_error_code ?? null,
          payload.last_error_message ?? payload.message ?? null
        )
      );
      setLessonDiagnostics([
        ...(payload.last_error_code
          ? [`error_code: ${payload.last_error_code}`]
          : []),
        ...(payload.last_error_message
          ? [`message: ${payload.last_error_message}`]
          : []),
      ]);
      setShowFallback(false);
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
      clearGenerationProgressTimers();
      const message =
        pollError instanceof Error
          ? pollError.message
          : "We couldn’t check your lesson status.";
      setError(message);
      setLessonError(message);
      setLessonStage("generation_failed");
      setYoutubeGenerationState("failed");
      setIsGenerating(false);
      setIsLessonGenerating(false);
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
          clearGenerationProgressTimers();
          const message =
            fallbackError instanceof Error
              ? fallbackError.message
              : "We couldn’t check your lesson status.";
          setError(message);
          setLessonError(message);
          setLessonStage("generation_failed");
          setYoutubeGenerationState("failed");
          setIsGenerating(false);
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
      setError("Enter an email address to get notified, or keep this page open.");
      return;
    }

    setNotificationStatus("idle");
    setError(null);

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
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "We couldn’t save your email.";
      setNotificationStatus("error");
      setError(message);
    }
  };

  const runLessonGeneration = async () => {
    if (isGenerating || isLessonGenerating) return;

    setIsLessonGenerating(true);
    setIsGenerating(false);
    setLessonError(null);
    setError(null);
    setLessonDiagnostics([]);
    setLessonResult(null);
    setLessonStage("generating_lesson");
    setNotificationStatus("idle");
    setIsRedirectingToLesson(false);
    setShowFallback(false);
    setLoadingPhase("generating");
    startGenerationProgressTimers();
    clearYoutubeTimers();

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
      const isYouTubeGeneration = Boolean(
        detectedSource?.type === "youtube_url" && !trimmedManualTranscript
      );

      console.info("[youtube-ui] source_detected", {
        detectedType: detectedSource?.type ?? null,
        requestPath: isYouTubeGeneration
          ? "youtube_job"
          : trimmedManualTranscript
            ? "direct_with_manual_transcript"
            : "direct_lesson_generate",
        hasManualTranscript: Boolean(trimmedManualTranscript),
      });

      if (isYouTubeGeneration) {
        setIsGenerating(true);
        setLoadingPhase("generating");
        setYoutubeGenerationState("processing_initial");
        setLessonStage("validating_url");
        if (!parseYouTubeVideoId(sourceUrl)) {
          clearYoutubeTimers();
          clearGenerationProgressTimers();
          setIsGenerating(false);
          setLessonStage("generation_failed");
          setYoutubeGenerationState("failed");
          setLessonError("Please enter a valid YouTube URL.");
          setError("Please enter a valid YouTube URL.");
          return;
        }
        setLessonStage("extracting_transcript");

        const jobResponse = await authenticatedFetch("/api/youtube-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...lessonForm,
            source_url: sourceUrl,
            industry: lessonForm.industry?.trim() || undefined,
            profession: lessonForm.profession?.trim() || undefined,
          }),
        });

        const jobPayload = (await jobResponse.json().catch(() => null)) as
          | { error?: string; id?: string; status_url?: string }
          | null;

        console.info("[youtube-ui] job_create_response", {
          status: jobResponse.status,
          ok: jobResponse.ok,
          hasJobId: Boolean(jobPayload?.id),
          statusUrl: jobPayload?.status_url ?? null,
        });

        if (!jobResponse.ok) {
          clearYoutubeTimers();
          clearGenerationProgressTimers();
          setIsGenerating(false);
          setLessonStage("generation_failed");
          setYoutubeGenerationState("failed");
          const message = jobPayload?.error || "We couldn’t start your lesson. Try again.";
          setLessonError(message);
          setError(message);
          return;
        }

        if (!jobPayload?.id) {
          throw new Error("We couldn’t start your lesson. Try again.");
        }

        setJobId(jobPayload.id);
        setJobStatusUrl(jobPayload?.status_url || null);
        setYoutubeGenerationState("processing_initial");
        setLessonStage("generating_lesson");
        triggerYouTubeJobProcessing();
        startYouTubePolling(jobPayload.id);
        startLoadingTimers(jobPayload.id);
        return;
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
            source_url: sourceUrl || undefined,
            source_text:
              detectedSource?.type === "raw_text" && !trimmedManualTranscript
                ? trimmedSourceInput
                : undefined,
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

        if (!response.ok) {
          console.warn("[lesson-generate] client_api_error", {
            status: response.status,
            errorCode:
              typeof apiPayload?.error_code === "string"
                ? apiPayload.error_code
                : null,
            message:
              typeof apiPayload?.error === "string"
                ? apiPayload.error
                : typeof apiPayload?.message === "string"
                  ? apiPayload.message
                  : null,
          });
        }

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
            setLessonStage("transcript_unavailable");
            setYoutubeGenerationState("needs_transcript");
            setLessonError(getTranscriptFallbackMessage(errorCode, errorMessage));
            clearGenerationProgressTimers();
            return;
          }
          setLessonStage("generation_failed");
          setYoutubeGenerationState("failed");
          setLessonError(errorMessage || "We could not generate the lesson.");
          clearGenerationProgressTimers();
          return;
        }

        rawResult = rawPayload;
        break;
      }

      setLessonStage("generating_lesson");
      const data = normalizeLessonOutput(rawResult);
      if (!data) {
        console.error("[lesson-generate] client_invalid_response_shape");
        throw new Error(
          "Lesson generation took longer than expected. Please try again."
        );
      }
      setLessonResult(data);
      setYoutubeGenerationState(isYouTubeGeneration ? "ready" : "idle");
      setLessonStage("idle");
      clearGenerationProgressTimers();
    } catch (error) {
      clearYoutubeTimers();
      clearGenerationProgressTimers();
      setIsGenerating(false);
      setLessonStage("generation_failed");
      setYoutubeGenerationState("failed");
      const message =
        error instanceof Error ? error.message : "We could not generate the lesson.";
      console.error("[lesson-generate] client_generation_failed", { message });
      setLessonDiagnostics((prev) => [
        ...prev,
        `client_error: ${message}`,
      ]);
      setLessonError(message);
      setError(message);
    } finally {
      if (!isGenerating) {
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
      const trimmedSourceInput = sourceInput.trim();
      const savedSource = trimmedSourceInput
        ? detectLessonSource(trimmedSourceInput)
        : null;
      const previewLesson = JSON.parse(
        JSON.stringify(lessonResult)
      ) as LessonGenerationOutput;
      const outputValidation = validateLessonOutputPayload(previewLesson);
      if (!outputValidation.ok) {
        setLessonError("Generated lesson is incomplete and cannot be saved yet.");
        return;
      }

      const response = await authenticatedFetch("/api/lesson/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: {
            ...lessonForm,
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

  const youtubeLoadingCopy = getYouTubeLoadingCopy(
    lessonStage,
    youtubeGenerationState,
    loadingPhase,
    generationProgressIndex
  );
  const generationLoadingCopy =
    isGenerating || isLessonGenerating
      ? getYouTubeLoadingCopy(
          lessonStage,
          youtubeGenerationState,
          loadingPhase,
          generationProgressIndex
        )
      : youtubeLoadingCopy;

  return (
    <section className="mobile-page-shell">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-7 lg:flex-row lg:items-end">
          <div>
            <p className="lumen-chip mb-4">Generator</p>
            <h1 className="lumen-heading text-balance text-[38px] leading-[1.04] sm:text-[48px]">
              Lesson Generator
            </h1>
            <p className="mt-3 max-w-[680px] text-sm leading-6 text-[var(--ink-muted)] sm:text-[15px]">
              Generate a structured Business English lesson from a topic, source
              link, or transcript.
            </p>
          </div>
          <div className="hidden rounded-full border border-[var(--border)] bg-[var(--glass)] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)] backdrop-blur sm:inline-flex">
            JSON validated output
          </div>
        </div>

        <div className="min-h-[560px] sm:min-h-[760px]">
          <Card className="p-0">
            <div className="border-b border-[var(--border)] px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                    New Lesson Flow
                  </p>
                  <h2 className="lumen-heading mt-2 text-2xl leading-tight sm:text-[30px]">
                    Build the lesson brief
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="lumen-chip">Topic</span>
                  <span className="lumen-chip">Source</span>
                  <span className="lumen-chip">Level</span>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-7">
            {isRedirectingToLesson ? (
              <div className="mb-4 rounded-[14px] border border-[var(--accent-gold)] bg-[var(--accent-gold-soft)] p-4">
                <p className="text-sm font-semibold text-[var(--ink)]">Lesson ready.</p>
                <p className="text-xs text-[var(--ink-muted)]">
                  Opening your lesson now...
                </p>
              </div>
            ) : null}
            <form onSubmit={handleLessonSubmit} action="" method="post">
              <div className="grid min-h-[520px] gap-5">
                {isGenerating || isLessonGenerating ? (
                  <div className="rounded-[14px] border border-[var(--border)] bg-[var(--glass-strong)] p-4 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">
                          {generationLoadingCopy.title}
                        </p>
                        <p className="text-xs text-[var(--ink-faint)]">
                          {generationLoadingCopy.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <fieldset
                  disabled={isGenerating || isLessonGenerating}
                  className={`grid gap-4 transition-all duration-300 ${
                    isGenerating || isLessonGenerating
                      ? "pointer-events-none opacity-45"
                      : "opacity-100"
                  }`}
                >
                  <div className="grid gap-2">
                    <label htmlFor="topic" className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
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
                    <label htmlFor="source_input" className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                      Source URL or text (optional)
                    </label>
                    <Textarea
                      id="source_input"
                      placeholder="Paste a YouTube link, article link, or source text"
                      value={sourceInput}
                      onChange={(event) => setSourceInput(event.target.value)}
                      rows={5}
                    />
                    <p className="text-xs leading-5 text-[var(--ink-faint)]">
                      YouTube links use the transcript pipeline. Article links and
                      pasted text generate directly.
                    </p>
                  </div>

                  {youtubeGenerationState === "needs_transcript" ||
                  manualTranscript.trim().length > 0 ? (
                    <div className="grid gap-2">
                      <label
                        htmlFor="manual_transcript"
                        className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]"
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
                        We couldn’t access this video’s transcript automatically. It may be region-restricted, private, age-restricted, bot-protected, or have captions disabled. You can paste the transcript manually to continue.
                      </p>
                      {process.env.NODE_ENV !== "production" &&
                      lessonDiagnostics.length > 0 ? (
                        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--glass)] p-3">
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
                      <label htmlFor="level" className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
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
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="C1">C1</option>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="industry" className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
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
                      <label htmlFor="profession" className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
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
                    <label htmlFor="lesson_type" className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
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

                {!isGenerating ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      disabled={isLessonGenerating}
                      className="w-full border-transparent bg-[image:var(--aurora-line)] px-5 py-3 text-xs font-extrabold text-[var(--accent-ink)] shadow-glow hover:opacity-95 sm:w-auto"
                    >
                      {isLessonGenerating ? "Generating..." : "Generate Lesson"}
                    </Button>
                    {lessonError && youtubeGenerationState !== "needs_transcript" ? (
                      <p className="text-xs text-[var(--accent-warm)]">
                        {lessonError}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {showFallback ? (
                  <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)] p-4 transition-all duration-300">
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
                      <label
                        htmlFor="fallback_email"
                        className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]"
                      >
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
                          setError(null);
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        onClick={handleEmailWhenReady}
                        className="w-full border-transparent bg-[image:var(--aurora-line)] px-5 py-3 text-xs font-extrabold text-[var(--accent-ink)] shadow-glow hover:opacity-95 sm:w-auto"
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
                    {notificationStatus === "error" || error ? (
                      <p className="text-xs text-[var(--accent-warm)]">
                        {error || "Please enter a valid email address."}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {!isLessonGenerating &&
                youtubeGenerationState === "needs_transcript" ? (
                  <p className="text-xs text-[var(--accent-warm)]">
                    {lessonError ||
                      "We couldn’t access this video’s transcript automatically. It may be region-restricted, private, age-restricted, bot-protected, or have captions disabled. You can paste the transcript manually to continue."}
                  </p>
                ) : null}
              </div>
            </form>
            </div>
          </Card>

          {lessonResult ? (
            <div className="mt-8">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <h2 className="lumen-heading text-3xl text-[var(--ink)]">
                  Lesson Preview
                </h2>
                <Button
                  onClick={handleLessonSave}
                  disabled={isLessonSaving}
                  className="border-transparent bg-[image:var(--aurora-line)] px-4 py-2.5 text-xs font-extrabold text-[var(--accent-ink)] shadow-glow hover:opacity-95"
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
        </div>
      </div>
    </section>
  );
}
