import { NextResponse } from "next/server";
import { listLessons } from "../../../../lib/data/lessons";
import { getRequestAuthUser } from "../../../../lib/supabase/auth";

export async function GET(request: Request) {
  const authUser = await getRequestAuthUser(request);
  if (!authUser) {
    console.error("[lesson/list] auth_failed");
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const lessons = await listLessons(authUser.id, authUser.access_token);
    return NextResponse.json(lessons);
  } catch (error) {
    console.error("[lesson/list] failed", {
      user_id: authUser.id,
      message: error instanceof Error ? error.message : "unknown_list_error",
    });
    return NextResponse.json(
      {
        error: "We could not load lessons right now.",
        ...(process.env.NODE_ENV !== "production"
          ? { details: error instanceof Error ? error.message : "unknown_list_error" }
          : {}),
      },
      { status: 500 }
    );
  }
}
