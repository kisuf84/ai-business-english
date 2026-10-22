import { NextResponse } from "next/server";
import {
  attachTranscriptAndQueueJob,
  getYouTubeLessonJob,
} from "../../../../../lib/data/youtubeJobs";
import { processYouTubeLessonJob } from "../../../../../lib/jobs/youtubeLessonProcessor";
import { getRequestAuthUser } from "../../../../../lib/supabase/auth";

const MAX_TRANSCRIPT_LENGTH = 200_000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authUser = await getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { transcript?: string };
  try {
    payload = (await request.json()) as { transcript?: string };
  } catch {
    return NextResponse.json(
      { error: "We couldn’t process your request. Try again." },
      { status: 400 }
    );
  }

  const transcript = payload.transcript?.trim() || "";
  if (transcript.length < 100) {
    return NextResponse.json(
      { error: "Please paste a longer transcript." },
      { status: 400 }
    );
  }

  if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
    return NextResponse.json(
      { error: "The transcript is too large. Please keep it under 200,000 characters." },
      { status: 413 }
    );
  }

  try {
    const existing = await getYouTubeLessonJob(id);
    if (!existing || existing.user_id !== authUser.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const queued = await attachTranscriptAndQueueJob(id, transcript);
    console.info("[youtube-job] transcript_submitted", { id: queued.id });

    const result = await processYouTubeLessonJob(queued);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[youtube-job] transcript_submit_failed", error);
    return NextResponse.json(
      { error: "We couldn’t continue this lesson. Try again." },
      { status: 500 }
    );
  }
}
