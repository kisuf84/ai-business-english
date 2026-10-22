import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { processQueuedYouTubeLessonJobs } from "../../../../lib/jobs/youtubeLessonProcessor";

// Give a single job's transcript+OpenAI round trip room to finish. Batch
// size is kept small (see call below) so one invocation doesn't need to
// cover multiple jobs' worth of latency within this budget.
export const maxDuration = 280;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // vercel.json schedules this fallback once daily at 06:00 UTC. Normal
    // lesson creation also triggers the authenticated per-job processor.
    // Keep this fallback batch small to stay within the function duration.
    const results = await processQueuedYouTubeLessonJobs(1);
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
