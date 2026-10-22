import { NextResponse } from "next/server";
import { getLessonById } from "../../../../lib/data/lessons";
import { getRequestAuthUser } from "../../../../lib/supabase/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authUser = await getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const lesson = await getLessonById(id, authUser.id);
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }
    return NextResponse.json(lesson);
  } catch (error) {
    console.error("[lesson/get] failed", {
      user_id: authUser.id,
      lesson_id: id,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json(
      {
        error: "We could not load this lesson right now.",
        ...(process.env.NODE_ENV !== "production"
          ? { details: error instanceof Error ? error.message : "unknown_error" }
          : {}),
      },
      { status: 500 }
    );
  }
}
