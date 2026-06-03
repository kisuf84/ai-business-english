import { NextResponse } from "next/server";
import type { LessonGenerationInput } from "../../../types/lesson";
import { createYouTubeLessonJob } from "../../../lib/data/youtubeJobs";
import { parseYouTubeVideoIdDetailed } from "../../../lib/youtube/url";
import { getRequestAuthUser } from "../../../lib/supabase/auth";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type YouTubeJobCreatePayload = LessonGenerationInput & {
  email?: string;
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
  console.info("[youtube-job] auth_resolved", {
    authenticated: Boolean(authUser),
    userId: authUser?.id ?? null,
  });

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
  const email = payload.email?.trim().toLowerCase() || "";
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

  if (email && !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  try {
    const job = await createYouTubeLessonJob({
      user_id: authUser?.id ?? null,
      topic: payload.topic?.trim() || "YouTube lesson",
      source_url: sourceUrl,
      video_id: parsed.videoId,
      email: email || null,
      level: payload.level?.trim() || "B1",
      industry: payload.industry?.trim() || undefined,
      profession: payload.profession?.trim() || undefined,
      lesson_type: payload.lesson_type?.trim() || "YouTube lesson",
    });

    console.info("[youtube-job] created", {
      id: job.id,
      videoId: job.video_id,
      hasEmail: Boolean(job.email),
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
