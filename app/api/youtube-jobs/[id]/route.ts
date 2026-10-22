import { NextResponse } from "next/server";
import {
  getYouTubeLessonJob,
  getYouTubeLessonJobLogSnapshot,
} from "../../../../lib/data/youtubeJobs";
import { getSupabaseServerDiagnostics } from "../../../../lib/supabase/server";
import { getRequestAuthUser } from "../../../../lib/supabase/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authUser = await getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.info("[youtube-job:status] incoming", {
      id,
      helper: "getYouTubeLessonJob -> supabaseServiceRoleRest",
      supabase: getSupabaseServerDiagnostics(),
    });

    const job = await getYouTubeLessonJob(id);
    console.info("[youtube-job:status] raw_row", {
      id,
      row: getYouTubeLessonJobLogSnapshot(job),
    });

    if (!job || job.user_id !== authUser.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const payload = {
      id: job.id,
      status: job.status,
      lesson_id: job.lesson_id,
      lesson_url: job.lesson_id ? `/lessons/${job.lesson_id}` : null,
      title: job.title,
      needs_transcript: job.status === "needs_transcript",
      last_error_code: job.last_error_code,
      last_error_message: job.last_error_message,
      message:
        job.status === "failed"
          ? "We couldn’t finish this lesson automatically."
          : null,
      created_at: job.created_at,
      updated_at: job.updated_at,
    };

    console.info("[youtube-job:status] response_payload", {
      id,
      payload,
    });
    console.info("[youtube-job-status] response", {
      id,
      status: payload.status,
      lastErrorCode: payload.last_error_code,
      hasLessonUrl: Boolean(payload.lesson_url),
    });

    return NextResponse.json(
      payload,
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[youtube-job] status_failed", error);
    return NextResponse.json(
      { error: "We couldn’t load this lesson job." },
      { status: 500 }
    );
  }
}
