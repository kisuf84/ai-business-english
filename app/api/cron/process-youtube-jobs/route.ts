import { NextResponse } from "next/server";
import { processQueuedYouTubeLessonJobs } from "../../../../lib/jobs/youtubeLessonProcessor";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await processQueuedYouTubeLessonJobs(3);
    return NextResponse.json({ ok: true, processed: results });
  } catch (error) {
    console.error("[youtube-job] cron_failed", error);
    return NextResponse.json(
      { error: "YouTube job processing failed." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
