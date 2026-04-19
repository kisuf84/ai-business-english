import { NextResponse } from "next/server";
import {
  attachTranscriptAndQueueJob,
  getYouTubeLessonJob,
} from "../../../../../lib/data/youtubeJobs";
import { processYouTubeLessonJob } from "../../../../../lib/jobs/youtubeLessonProcessor";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

  try {
    const existing = await getYouTubeLessonJob(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const queued = await attachTranscriptAndQueueJob(params.id, transcript);
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
