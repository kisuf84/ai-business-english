import { NextResponse } from "next/server";
import { listCourses } from "../../../../lib/data/courses";

export async function GET() {
  try {
    const courses = await listCourses();
    return NextResponse.json(Array.isArray(courses) ? courses : []);
  } catch {
    return NextResponse.json(
      { error: "Could not load courses." },
      { status: 500 }
    );
  }
}
