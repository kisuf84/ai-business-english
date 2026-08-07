import type {
  LessonGenerationInput,
  YouTubeLessonJob,
  YouTubeLessonJobStatus,
} from "../../types/lesson";
import {
  getSupabaseServerDiagnostics,
  supabaseServiceRoleRest,
} from "../supabase/server";

export type CreateYouTubeLessonJobInput = LessonGenerationInput & {
  source_url: string;
  video_id: string;
  email?: string | null;
  user_id?: string | null;
};

export async function createYouTubeLessonJob(
  input: CreateYouTubeLessonJobInput
): Promise<YouTubeLessonJob> {
  const now = new Date().toISOString();
  const [created] = await supabaseServiceRoleRest<YouTubeLessonJob[]>(
    "youtube_lesson_jobs",
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        user_id: input.user_id ?? null,
        source_url: input.source_url,
        video_id: input.video_id,
        email: input.email || null,
        status: "queued",
        topic: input.topic || null,
        level: input.level || null,
        industry: input.industry || null,
        profession: input.profession || null,
        lesson_type: input.lesson_type || null,
        attempts: 0,
        updated_at: now,
      }),
    }
  );

  if (!created?.id) {
    throw new Error("youtube_job_create_failed");
  }

  return created;
}

export async function getYouTubeLessonJob(
  id: string
): Promise<YouTubeLessonJob | null> {
  const path = `youtube_lesson_jobs?select=*&id=eq.${encodeURIComponent(
    id
  )}&limit=1`;
  logJobDebug("get.query", {
    id,
    path,
    helper: "supabaseServiceRoleRest",
    supabase: getSupabaseServerDiagnostics(),
  });
  const results = await supabaseServiceRoleRest<YouTubeLessonJob[]>(path);
  const row = results[0] ?? null;

  logJobDebug("get.result", {
    id,
    path,
    rowCount: results.length,
    row: sanitizeJobForLog(row),
    fallbackTriggered: !row,
  });

  return row;
}

function logJobDebug(stage: string, details: Record<string, unknown>) {
  console.info(`[youtube-job:data] ${stage}`, details);
}

function sanitizeJobForLog(job: YouTubeLessonJob | null) {
  if (!job) return null;
  return {
    id: job.id,
    video_id: job.video_id,
    status: job.status,
    lesson_id: job.lesson_id,
    title: job.title,
    attempts: job.attempts,
    last_error_code: job.last_error_code,
    last_error_message: job.last_error_message,
    created_at: job.created_at,
    updated_at: job.updated_at,
    hasEmail: Boolean(job.email),
    transcriptLength: job.transcript_text?.length ?? 0,
  };
}

function sanitizePatchForLog(
  patch: Partial<
    Pick<
      YouTubeLessonJob,
      | "status"
      | "email"
      | "transcript_text"
      | "lesson_id"
      | "title"
      | "attempts"
      | "last_error_code"
      | "last_error_message"
    >
  >
) {
  return {
    ...patch,
    transcript_text:
      patch.transcript_text === undefined
        ? undefined
        : patch.transcript_text === null
        ? null
        : `[${patch.transcript_text.length} chars]`,
    email:
      patch.email === undefined ? undefined : patch.email ? "[provided]" : null,
  };
}

export function getYouTubeLessonJobLogSnapshot(job: YouTubeLessonJob | null) {
  return sanitizeJobForLog(job);
}

const MAX_ATTEMPTS = 3;
// A job whose worker invocation dies mid-flight (crash, redeploy,
// platform execution-duration cutoff) is left in "processing" forever,
// since that status was previously never re-queried by the cron. Root
// cause confirmed in production: job 8335999e-383b-49bb-b660-b77fdcaa4d19
// has been stuck in "processing" since 2026-06-02 with no recovery path.
const STALE_PROCESSING_MINUTES = 15;

// TEMP-LOG (Priority 3 diagnostics): reclaim + retry-count reporting for
// jobs orphaned in "processing". Safe to remove once stuck-job reports stop.
export async function reclaimStaleProcessingYouTubeLessonJobs(): Promise<{
  requeued: number;
  failed: number;
}> {
  const staleBefore = new Date(
    Date.now() - STALE_PROCESSING_MINUTES * 60 * 1000
  ).toISOString();

  const requeued = await supabaseServiceRoleRest<YouTubeLessonJob[]>(
    `youtube_lesson_jobs?status=eq.processing&updated_at=lt.${encodeURIComponent(
      staleBefore
    )}&attempts=lt.${MAX_ATTEMPTS}&select=id`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status: "queued" satisfies YouTubeLessonJobStatus,
        last_error_code: "stale_processing_reclaimed",
        last_error_message:
          "Job was stuck in processing (worker likely terminated mid-run) and was automatically re-queued.",
      }),
    }
  );

  const failed = await supabaseServiceRoleRest<YouTubeLessonJob[]>(
    `youtube_lesson_jobs?status=eq.processing&updated_at=lt.${encodeURIComponent(
      staleBefore
    )}&attempts=gte.${MAX_ATTEMPTS}&select=id`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status: "failed" satisfies YouTubeLessonJobStatus,
        last_error_code: "stale_processing_exhausted",
        last_error_message:
          "Job was stuck in processing and had already exhausted its retry attempts.",
      }),
    }
  );

  if (requeued.length > 0 || failed.length > 0) {
    logJobDebug("reclaim.stale_processing", {
      staleBefore,
      requeuedIds: requeued.map((job) => job.id),
      failedIds: failed.map((job) => job.id),
    });
  }

  return { requeued: requeued.length, failed: failed.length };
}

export async function listProcessableYouTubeLessonJobs(
  limit = 3
): Promise<YouTubeLessonJob[]> {
  const safeLimit = Math.max(1, Math.min(10, limit));
  return supabaseServiceRoleRest<YouTubeLessonJob[]>(
    `youtube_lesson_jobs?select=*&status=in.(queued,failed)&attempts=lt.${MAX_ATTEMPTS}&order=created_at.asc&limit=${safeLimit}`
  );
}

export async function updateYouTubeLessonJob(
  id: string,
  patch: Partial<
    Pick<
      YouTubeLessonJob,
      | "status"
      | "email"
      | "transcript_text"
      | "lesson_id"
      | "title"
      | "attempts"
      | "last_error_code"
      | "last_error_message"
    >
  >
): Promise<YouTubeLessonJob> {
  const path = `youtube_lesson_jobs?id=eq.${encodeURIComponent(id)}&select=*`;
  logJobDebug("update.attempt", {
    id,
    path,
    patch: sanitizePatchForLog(patch),
    helper: "supabaseServiceRoleRest",
    supabase: getSupabaseServerDiagnostics(),
  });
  const updatedRows = await supabaseServiceRoleRest<YouTubeLessonJob[]>(
    path,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        ...patch,
        updated_at: new Date().toISOString(),
      }),
    }
  );
  const updated = updatedRows[0] ?? null;

  logJobDebug("update.returned", {
    id,
    path,
    rows: updatedRows.length,
    status: updated?.status ?? null,
    updated: sanitizeJobForLog(updated),
  });

  if (!updated?.id) {
    throw new Error("youtube_job_update_failed");
  }

  const persisted = await getYouTubeLessonJob(id);
  logJobDebug("update.persisted", {
    id,
    status: persisted?.status ?? null,
    persisted: sanitizeJobForLog(persisted),
  });

  if (!persisted?.id) {
    throw new Error("youtube_job_update_verify_failed");
  }

  return persisted;
}

export async function claimYouTubeLessonJob(
  job: YouTubeLessonJob
): Promise<YouTubeLessonJob | null> {
  logJobDebug("claim.attempt", {
    id: job.id,
    expectedStatus: job.status,
    nextStatus: "processing",
  });
  const path = `youtube_lesson_jobs?id=eq.${encodeURIComponent(
    job.id
  )}&status=eq.${encodeURIComponent(job.status)}&select=*`;
  const claimedRows = await supabaseServiceRoleRest<YouTubeLessonJob[]>(
    path,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status: "processing" satisfies YouTubeLessonJobStatus,
        attempts: job.attempts + 1,
        updated_at: new Date().toISOString(),
      }),
    }
  );
  const claimed = claimedRows[0] ?? null;

  logJobDebug("claim.returned", {
    id: job.id,
    path,
    rows: claimedRows.length,
    status: claimed?.status ?? null,
    claimed: sanitizeJobForLog(claimed),
  });

  if (!claimed) {
    return null;
  }

  const persisted = await getYouTubeLessonJob(job.id);
  logJobDebug("claim.persisted", {
    id: job.id,
    status: persisted?.status ?? null,
    persisted: sanitizeJobForLog(persisted),
  });

  return persisted;
}

export async function attachTranscriptAndQueueJob(
  id: string,
  transcriptText: string
): Promise<YouTubeLessonJob> {
  return updateYouTubeLessonJob(id, {
    transcript_text: transcriptText,
    status: "queued",
    last_error_code: null,
    last_error_message: null,
  });
}
