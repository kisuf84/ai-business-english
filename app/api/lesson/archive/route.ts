import { NextResponse } from "next/server";
import { archiveLesson } from "../../../../lib/data/lessons";
import { getRequestAuthUser } from "../../../../lib/supabase/auth";

const REQUIRED_FIELDS_ERROR = "Please complete all required fields";
const PROCESSING_ERROR = "We couldn’t process your request. Try again.";

export async function POST(request: Request) {
  const authUser = await getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let payload: { id?: string };

  try {
    payload = (await request.json()) as { id?: string };
  } catch {
    return NextResponse.json({ error: PROCESSING_ERROR }, { status: 400 });
  }

  if (!payload?.id) {
    return NextResponse.json({ error: REQUIRED_FIELDS_ERROR }, { status: 400 });
  }

  try {
    await archiveLesson(payload.id, authUser.id);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    // TEMP-LOG (Priority 3 diagnostics): surface the real Supabase/PostgREST
    // error instead of masking every failure as a generic 404.
    console.error("[lesson-archive] archive_failed", {
      lessonId: payload.id,
      userId: authUser.id,
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }
}
