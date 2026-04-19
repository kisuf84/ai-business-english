import { NextResponse } from "next/server";
import type { LessonGenerationInput } from "../../../types/lesson";
import { createYouTubeLessonJob } from "../../../lib/data/youtubeJobs";
import { parseYouTubeVideoIdDetailed } from "../../../lib/youtube/url";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  let payload: LessonGenerationInput & { email?: string };

  try {
    payload = (await request.json()) as LessonGenerationInput & { email?: string };
  } catch {
    return NextResponse.json(
      { error: "We couldn’t process your request. Try again." },
      { status: 400 }
    );
  }

  const sourceUrl = payload.source_url?.trim() || "";
  const email = payload.email?.trim().toLowerCase() || "";
  const parsed = parseYouTubeVideoIdDetailed(sourceUrl);

  if (!parsed.ok) {
    return NextResponse.json(
      { error: "Please enter a valid YouTube URL." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  try {
    const job = await createYouTubeLessonJob({
      topic: payload.topic?.trim() || "YouTube lesson",
      source_url: sourceUrl,
      video_id: parsed.videoId,
      email,
      level: payload.level?.trim() || "B1",
      industry: payload.industry?.trim() || undefined,
      profession: payload.profession?.trim() || undefined,
      lesson_type: payload.lesson_type?.trim() || "YouTube lesson",
    });

    console.info("[youtube-job] created", {
      id: job.id,
      videoId: job.video_id,
      email: job.email,
    });

    return NextResponse.json(
      {
        id: job.id,
        status: job.status,
        status_url: `/generator/jobs/${job.id}`,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("[youtube-job] create_failed", error);
    return NextResponse.json(
      { error: "We couldn’t start your lesson. Try again." },
      { status: 500 }
    );
  }
}
