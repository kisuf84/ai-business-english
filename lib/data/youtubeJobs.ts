import type {
  LessonGenerationInput,
  YouTubeLessonJob,
  YouTubeLessonJobStatus,
} from "../../types/lesson";
import { supabaseRest } from "../supabase/server";

export type CreateYouTubeLessonJobInput = LessonGenerationInput & {
  source_url: string;
  video_id: string;
  email: string;
};

export async function createYouTubeLessonJob(
  input: CreateYouTubeLessonJobInput
): Promise<YouTubeLessonJob> {
  const now = new Date().toISOString();
  const [created] = await supabaseRest<YouTubeLessonJob[]>("youtube_lesson_jobs", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      source_url: input.source_url,
      video_id: input.video_id,
      email: input.email,
      status: "queued",
      topic: input.topic || null,
      level: input.level || null,
      industry: input.industry || null,
      profession: input.profession || null,
      lesson_type: input.lesson_type || null,
      attempts: 0,
      updated_at: now,
    }),
  });

  if (!created?.id) {
    throw new Error("youtube_job_create_failed");
  }

  return created;
}

export async function getYouTubeLessonJob(
  id: string
): Promise<YouTubeLessonJob | null> {
  const results = await supabaseRest<YouTubeLessonJob[]>(
    `youtube_lesson_jobs?select=*&id=eq.${id}`
  );
  return results[0] ?? null;
}

function logJobUpdate(stage: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`[youtube-job:data] ${stage}`, details);
}

export async function listProcessableYouTubeLessonJobs(
  limit = 3
): Promise<YouTubeLessonJob[]> {
  const safeLimit = Math.max(1, Math.min(10, limit));
  return supabaseRest<YouTubeLessonJob[]>(
    `youtube_lesson_jobs?select=*&status=in.(queued,failed)&attempts=lt.3&order=created_at.asc&limit=${safeLimit}`
  );
}

export async function updateYouTubeLessonJob(
  id: string,
  patch: Partial<
    Pick<
      YouTubeLessonJob,
      | "status"
      | "transcript_text"
      | "lesson_id"
      | "title"
      | "attempts"
      | "last_error_code"
      | "last_error_message"
    >
  >
): Promise<YouTubeLessonJob> {
  logJobUpdate("update.attempt", { id, patch });
  const updatedRows = await supabaseRest<YouTubeLessonJob[]>(
    `youtube_lesson_jobs?id=eq.${id}&select=*`,
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

  logJobUpdate("update.returned", {
    id,
    rows: updatedRows.length,
    status: updated?.status ?? null,
    updated,
  });

  if (!updated?.id) {
    throw new Error("youtube_job_update_failed");
  }

  const persisted = await getYouTubeLessonJob(id);
  logJobUpdate("update.persisted", {
    id,
    status: persisted?.status ?? null,
    persisted,
  });

  if (!persisted?.id) {
    throw new Error("youtube_job_update_verify_failed");
  }

  return persisted;
}

export async function claimYouTubeLessonJob(
  job: YouTubeLessonJob
): Promise<YouTubeLessonJob | null> {
  logJobUpdate("claim.attempt", {
    id: job.id,
    expectedStatus: job.status,
    nextStatus: "processing",
  });
  const claimedRows = await supabaseRest<YouTubeLessonJob[]>(
    `youtube_lesson_jobs?id=eq.${job.id}&status=eq.${job.status}&select=*`,
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

  logJobUpdate("claim.returned", {
    id: job.id,
    rows: claimedRows.length,
    status: claimed?.status ?? null,
    claimed,
  });

  if (!claimed) {
    return null;
  }

  const persisted = await getYouTubeLessonJob(job.id);
  logJobUpdate("claim.persisted", {
    id: job.id,
    status: persisted?.status ?? null,
    persisted,
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
