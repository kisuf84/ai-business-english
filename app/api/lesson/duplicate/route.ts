import { NextResponse } from "next/server";
import { duplicateLesson } from "../../../../lib/data/lessons";
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
    const duplicated = await duplicateLesson(payload.id, authUser.id);

    if (!duplicated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ id: duplicated.id });
  } catch (error) {
    // TEMP-LOG (Priority 3 diagnostics): this call previously had no
    // try/catch, so failures surfaced as an opaque unhandled 500.
    console.error("[lesson-duplicate] duplicate_failed", {
      lessonId: payload.id,
      userId: authUser.id,
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: PROCESSING_ERROR }, { status: 500 });
  }
}
