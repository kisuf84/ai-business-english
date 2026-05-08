import { NextResponse } from "next/server";
import { listLessons } from "../../../../lib/data/lessons";
import { getRequestAuthUser } from "../../../../lib/supabase/auth";

export async function GET(request: Request) {
  const authUser = await getRequestAuthUser(request);
  console.info("[lesson/list] auth_check", {
    authResolved: Boolean(authUser),
    userId: authUser?.id ?? null,
    hasBearerToken: Boolean(authUser?.access_token),
  });
  if (!authUser) {
    console.error("[lesson/list] auth_failed");
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const lessons = await listLessons(authUser.id);
    console.info("[lesson/list] list_success", {
      userId: authUser.id,
      returnedCount: Array.isArray(lessons) ? lessons.length : 0,
    });
    return NextResponse.json(lessons);
  } catch (error) {
    console.error("[lesson/list] failed", {
      authResolved: true,
      user_id: authUser.id,
      hasBearerToken: Boolean(authUser.access_token),
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
