import { NextResponse } from "next/server";
import type { LessonGenerationInput } from "../../../types/lesson";
import { createYouTubeLessonJob } from "../../../lib/data/youtubeJobs";
import { parseYouTubeVideoIdDetailed } from "../../../lib/youtube/url";
import { getRequestAuthUser } from "../../../lib/supabase/auth";

type YouTubeJobCreatePayload = LessonGenerationInput & {
  sourceUrl?: string;
  url?: string;
};

function normalizeSourceUrl(payload: YouTubeJobCreatePayload): string {
  return (
    payload.source_url?.trim() ||
    payload.sourceUrl?.trim() ||
    payload.url?.trim() ||
    ""
  );
}

export async function POST(request: Request) {
  const authUser = await getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > 25_000) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  let payload: YouTubeJobCreatePayload;

  try {
    payload = (await request.json()) as YouTubeJobCreatePayload;
  } catch {
    return NextResponse.json(
      { error: "We couldn’t process your request. Try again." },
      { status: 400 }
    );
  }

  const sourceUrl = normalizeSourceUrl(payload);
  const oversizedField = [
    sourceUrl.length > 2_048,
    (payload.topic?.length || 0) > 500,
    (payload.level?.length || 0) > 200,
    (payload.industry?.length || 0) > 200,
    (payload.profession?.length || 0) > 200,
    (payload.lesson_type?.length || 0) > 200,
  ].some(Boolean);
  if (oversizedField) {
    return NextResponse.json({ error: "One or more fields are too large." }, { status: 400 });
  }
  const parsed = parseYouTubeVideoIdDetailed(sourceUrl);
  console.info("[youtube-job] source_received", {
    hasSourceUrl: Boolean(sourceUrl),
    parsed: parsed.ok,
    videoId: parsed.ok ? parsed.videoId : null,
  });

  if (!parsed.ok) {
    return NextResponse.json(
      { error: "Please enter a valid YouTube URL." },
      { status: 400 }
    );
  }

  try {
    const job = await createYouTubeLessonJob({
      user_id: authUser.id,
      topic: payload.topic?.trim() || "YouTube lesson",
      source_url: sourceUrl,
      video_id: parsed.videoId,
      level: payload.level?.trim() || "B1",
      industry: payload.industry?.trim() || undefined,
      profession: payload.profession?.trim() || undefined,
      lesson_type: payload.lesson_type?.trim() || "YouTube lesson",
    });

    console.info("[youtube-job] created", {
      id: job.id,
      videoId: job.video_id,
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
    console.error("[youtube-job] create_failed", {
      message: error instanceof Error ? error.message : "unknown_create_error",
    });
    return NextResponse.json(
      { error: "We couldn’t start your lesson. Try again." },
      { status: 500 }
    );
  }
}
