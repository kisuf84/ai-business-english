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
  updateYouTubeLessonJob,
} from "../data/youtubeJobs";
import { getAppBaseUrl, sendEmail } from "../email/resend";
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

async function sendReadyEmail(job: YouTubeLessonJob, lessonId: string) {
  if (!job.email) return false;
  const lessonUrl = `${getAppBaseUrl()}/lessons/${lessonId}`;
  await sendEmail({
    to: job.email,
    subject: "Your lesson is ready",
    html: [
      "<p>Your Business English lesson is ready.</p>",
      `<p><a href="${lessonUrl}">Open your lesson</a></p>`,
    ].join(""),
  });
  return true;
}

async function sendNeedsTranscriptEmail(job: YouTubeLessonJob) {
  if (!job.email) return false;
  const recoveryUrl = `${getAppBaseUrl()}/generator/jobs/${job.id}`;
  await sendEmail({
    to: job.email,
    subject: "We’re almost done with your lesson",
    html: [
      "<p>We’re almost done creating your lesson.</p>",
      "<p>This video needs a transcript before we can finish it.</p>",
      `<p><a href="${recoveryUrl}">Paste the transcript and continue</a></p>`,
    ].join(""),
  });
  return true;
}

async function sendFailedEmail(job: YouTubeLessonJob) {
  if (!job.email) return false;
  const recoveryUrl = `${getAppBaseUrl()}/generator/jobs/${job.id}`;
  await sendEmail({
    to: job.email,
    subject: "We couldn’t finish your lesson",
    html: [
      "<p>We couldn’t finish this lesson automatically.</p>",
      `<p>You can still continue here: <a href="${recoveryUrl}">open lesson job</a></p>`,
    ].join(""),
  });
  return true;
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
        const updated = await updateYouTubeLessonJob(claimed.id, {
          status,
          last_error_code: transcript.reason,
          last_error_message: transcript.message,
        });

        if (!shouldRetry) {
          const sent = await sendNeedsTranscriptEmail(updated);
          if (sent) {
            console.info("[youtube-job] needs_transcript_email_sent", {
              id: updated.id,
            });
          }
        }

        return { id: claimed.id, status };
      }

      transcriptText = transcript.sourceText;
      transcriptLanguage = transcript.languageCode;
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
    const rawOutput = await generateLesson(prompt);
    const parsed = parseAndValidateLessonOutput(rawOutput);

    if (!parsed.ok) {
      throw new Error(parsed.error);
    }

    const lesson = await createLesson({
      input,
      output: parsed.data,
      user_id: null,
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

    const readyEmailSent = await sendReadyEmail(ready, lesson.id);
    if (readyEmailSent) {
      console.info("[youtube-job] ready_email_sent", { id: ready.id });
    }
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

    if (updated.status === "failed") {
      const failedEmailSent = await sendFailedEmail(updated);
      if (failedEmailSent) {
        console.info("[youtube-job] failed_email_sent", { id: updated.id });
      }
    }

    return { id: updated.id, status: updated.status };
  }
}

export async function processQueuedYouTubeLessonJobs(limit = 3) {
  const jobs = await listProcessableYouTubeLessonJobs(limit);
  const results = [];
  for (const job of jobs) {
    results.push(await processYouTubeLessonJob(job));
  }
  return results;
}
