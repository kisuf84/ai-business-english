import { NextResponse } from "next/server";
import { getRequestAuthUser } from "../../../../../lib/supabase/auth";
import { getYouTubeLessonJob } from "../../../../../lib/data/youtubeJobs";
import { processYouTubeLessonJob } from "../../../../../lib/jobs/youtubeLessonProcessor";

export const maxDuration = 280;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authUser = await getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const job = await getYouTubeLessonJob(id);
    if (!job || job.user_id !== authUser.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (job.status !== "queued" && job.status !== "failed") {
      return NextResponse.json({ ok: true, id: job.id, status: job.status });
    }

    const result = await processYouTubeLessonJob(job);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[youtube-job] user_process_failed", {
      id,
      name: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json(
      { error: "We couldn’t process this lesson yet." },
      { status: 500 }
    );
  }
}
