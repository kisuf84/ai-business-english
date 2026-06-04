import { NextResponse } from "next/server";
import { updateLessonVisibility } from "../../../../lib/data/lessons";
import { getRequestAuthUser } from "../../../../lib/supabase/auth";

const REQUIRED_FIELDS_ERROR = "Please complete all required fields";
const PROCESSING_ERROR = "We couldn’t process your request. Try again.";

export async function POST(request: Request) {
  const authUser = await getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let payload: {
    id?: string;
    visibility?: "private" | "public";
  };

  try {
    payload = (await request.json()) as {
      id?: string;
      visibility?: "private" | "public";
    };
  } catch {
    return NextResponse.json({ error: PROCESSING_ERROR }, { status: 400 });
  }

  if (!payload?.id || !payload?.visibility) {
    return NextResponse.json({ error: REQUIRED_FIELDS_ERROR }, { status: 400 });
  }

  try {
    await updateLessonVisibility(payload.id, payload.visibility, authUser.id);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message === "lesson_visibility_update_not_found"
            ? "Lesson not found."
            : "We could not update lesson visibility. Please try again.",
        ...(process.env.NODE_ENV !== "production"
          ? { details: error instanceof Error ? error.message : "unknown_visibility_error" }
          : {}),
      },
      {
        status:
          error instanceof Error && error.message === "lesson_visibility_update_not_found"
            ? 404
            : 500,
      }
    );
  }
}
