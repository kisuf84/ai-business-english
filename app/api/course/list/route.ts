import { NextResponse } from "next/server";
import { listCourses } from "../../../../lib/data/courses";
import { getRequestAuthUser } from "../../../../lib/supabase/auth";

export async function GET(request: Request) {
  const authUser = await getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const courses = await listCourses(authUser.id);
    return NextResponse.json(Array.isArray(courses) ? courses : []);
  } catch {
    return NextResponse.json(
      { error: "Could not load courses." },
      { status: 500 }
    );
  }
}
