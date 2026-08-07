import { NextResponse } from "next/server";
import { processQueuedYouTubeLessonJobs } from "../../../../lib/jobs/youtubeLessonProcessor";

// Give a single job's transcript+OpenAI round trip room to finish. Batch
// size is kept small (see call below) so one invocation doesn't need to
// cover multiple jobs' worth of latency within this budget.
export const maxDuration = 280;

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
    // Cron now runs every 10 minutes (was once/day) rather than a large
    // per-run batch, so per-invocation duration stays well under the
    // platform limit. Throughput is still far higher than the old daily run.
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
