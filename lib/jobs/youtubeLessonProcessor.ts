import type {
  LessonGenerationInput,
  YouTubeLessonJob,
} from "../../types/lesson";
import {
  buildLessonPrompt,
  generateLesson,
  parseAndValidateLessonOutput,
} from "../ai/lesson";
import { createLesson } from "../data/lessons";
import {
  claimYouTubeLessonJob,
  listProcessableYouTubeLessonJobs,
  reclaimStaleProcessingYouTubeLessonJobs,
  updateYouTubeLessonJob,
} from "../data/youtubeJobs";
import { fetchYouTubeTranscriptSource } from "../youtube/transcript";

const MAX_ATTEMPTS = 3;

function jobInput(job: YouTubeLessonJob): LessonGenerationInput {
  return {
    topic: job.topic || "YouTube lesson",
    source_url: job.source_url,
    level: job.level || "B1",
    industry: job.industry || undefined,
    profession: job.profession || undefined,
    lesson_type: job.lesson_type || "YouTube lesson",
  };
}

function isRecoverableTranscriptError(code: string | null | undefined): boolean {
  return code === "transcript_fetch_failed" || code === "unknown_error";
}

export async function processYouTubeLessonJob(job: YouTubeLessonJob): Promise<{
  id: string;
  status: string;
}> {
  console.info("[youtube-job] picked_up", {
    id: job.id,
    status: job.status,
    attempts: job.attempts,
  });

  const claimed = job.status === "processing" ? job : await claimYouTubeLessonJob(job);
  if (!claimed) {
    console.info("[youtube-job] claim_skipped", { id: job.id });
    return { id: job.id, status: "skipped" };
  }

  try {
    let transcriptText = claimed.transcript_text?.trim() || "";
    let transcriptLanguage: string | null = null;
    let transcriptSegments:
      | Array<{ start: number; duration?: number; text: string }>
      | null = null;

    if (!transcriptText) {
      const transcript = await fetchYouTubeTranscriptSource(claimed.source_url);
      if (!transcript.ok) {
        console.warn("[youtube-job] transcript_failed", {
          id: claimed.id,
          reason: transcript.reason,
          attempt: claimed.attempts,
        });

        const shouldRetry =
          isRecoverableTranscriptError(transcript.reason) &&
          claimed.attempts < MAX_ATTEMPTS;

        const status = shouldRetry ? "queued" : "needs_transcript";
        await updateYouTubeLessonJob(claimed.id, {
          status,
          last_error_code: transcript.reason,
          last_error_message: transcript.message,
        });

        return { id: claimed.id, status };
      }

      transcriptText = transcript.sourceText;
      transcriptLanguage = transcript.languageCode;
      transcriptSegments = Array.isArray(transcript.transcriptSegments)
        ? transcript.transcriptSegments
        : null;
      await updateYouTubeLessonJob(claimed.id, {
        transcript_text: transcriptText,
        last_error_code: null,
        last_error_message: null,
      });
      console.info("[youtube-job] transcript_success", {
        id: claimed.id,
        languageCode: transcriptLanguage,
        textLength: transcriptText.length,
      });
    }

    const input = jobInput(claimed);
    const prompt = buildLessonPrompt({
      input,
      sourceText: transcriptText,
      sourceKind: "youtube_transcript",
      videoId: claimed.video_id,
    });
    console.info("[youtube-processor] generation_start", {
      id: claimed.id,
      videoId: claimed.video_id,
      transcriptLength: transcriptText.length,
      hasTranscriptSegments: Boolean(transcriptSegments?.length),
    });
    const generated = await generateLesson(prompt);
    console.info("[youtube-job] openai_response", {
      id: claimed.id,
      durationMs: generated.durationMs,
      estimatedLessonSize: {
        characters: generated.text.length,
        estimatedTokens: generated.estimatedOutputTokens,
      },
      finishReasons: generated.finishReasons,
      usage: generated.usage,
    });
    const parsed = parseAndValidateLessonOutput(generated.text);

    if (!parsed.ok) {
      throw new Error(parsed.error);
    }

    const lesson = await createLesson({
      input,
      output: parsed.data,
      user_id: claimed.user_id ?? null,
      transcript_text: transcriptText,
      transcript_segments: transcriptSegments,
    });

    const ready = await updateYouTubeLessonJob(claimed.id, {
      status: "ready",
      lesson_id: lesson.id,
      title: lesson.title,
      last_error_code: null,
      last_error_message: null,
    });

    console.info("[youtube-job] lesson_ready", {
      id: ready.id,
      lessonId: lesson.id,
    });

    return { id: ready.id, status: "ready" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    const nextStatus = claimed.attempts >= MAX_ATTEMPTS ? "failed" : "queued";
    const updated = await updateYouTubeLessonJob(claimed.id, {
      status: nextStatus,
      last_error_code: "generation_failed",
      last_error_message: message,
    });
    console.error("[youtube-job] processing_failed", {
      id: updated.id,
      status: updated.status,
      message,
    });
    console.error("[youtube-processor] generation_failure", {
      id: updated.id,
      status: updated.status,
      attempts: updated.attempts,
      message,
    });

    return { id: updated.id, status: updated.status };
  }
}

export async function processQueuedYouTubeLessonJobs(limit = 3) {
  // Root cause fix: jobs whose worker died mid-run were stuck in
  // "processing" forever because this query previously only looked at
  // queued/failed jobs. Reclaim stale ones before picking new work.
  const reclaimed = await reclaimStaleProcessingYouTubeLessonJobs();
  if (reclaimed.requeued > 0 || reclaimed.failed > 0) {
    console.info("[youtube-job] stale_processing_reclaimed", reclaimed);
  }

  const jobs = await listProcessableYouTubeLessonJobs(limit);
  const results = [];
  for (const job of jobs) {
    results.push(await processYouTubeLessonJob(job));
  }
  return results;
}
