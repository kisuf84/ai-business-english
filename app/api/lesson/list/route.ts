import { NextResponse } from "next/server";
import { listLessons } from "../../../../lib/data/lessons";

export async function GET() {
  try {
    const lessons = await listLessons();
    return NextResponse.json(lessons);
  } catch (error) {
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
