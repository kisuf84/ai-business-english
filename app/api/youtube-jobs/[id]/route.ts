import { NextResponse } from "next/server";
import {
  getYouTubeLessonJob,
  getYouTubeLessonJobLogSnapshot,
  updateYouTubeLessonJob,
} from "../../../../lib/data/youtubeJobs";
import { getSupabaseServerDiagnostics } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.info("[youtube-job:status] incoming", {
      id: params.id,
      helper: "getYouTubeLessonJob -> supabaseServiceRoleRest",
      supabase: getSupabaseServerDiagnostics(),
    });

    const job = await getYouTubeLessonJob(params.id);
    console.info("[youtube-job:status] raw_row", {
      id: params.id,
      row: getYouTubeLessonJobLogSnapshot(job),
    });

    if (!job) {
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
      id: params.id,
      payload,
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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  let payload: { email?: string };

  try {
    payload = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json(
      { error: "We couldn’t process your request. Try again." },
      { status: 400 }
    );
  }

  const email = payload.email?.trim().toLowerCase() || "";
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  try {
    const updated = await updateYouTubeLessonJob(params.id, { email });
    return NextResponse.json(
      {
        id: updated.id,
        status: updated.status,
        has_email: Boolean(updated.email),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[youtube-job] email_update_failed", error);
    return NextResponse.json(
      { error: "We couldn’t save your email." },
      { status: 500 }
    );
  }
}
