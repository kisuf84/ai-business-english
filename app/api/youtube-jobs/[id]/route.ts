import { NextResponse } from "next/server";
import { getYouTubeLessonJob } from "../../../../lib/data/youtubeJobs";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const job = await getYouTubeLessonJob(params.id);
    if (!job) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      lesson_id: job.lesson_id,
      lesson_url: job.lesson_id ? `/lessons/${job.lesson_id}` : null,
      title: job.title,
      needs_transcript: job.status === "needs_transcript",
      message:
        job.status === "failed"
          ? "We couldn’t finish this lesson automatically."
          : null,
    });
  } catch (error) {
    console.error("[youtube-job] status_failed", error);
    return NextResponse.json(
      { error: "We couldn’t load this lesson job." },
      { status: 500 }
    );
  }
}
