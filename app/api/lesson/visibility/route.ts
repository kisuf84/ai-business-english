import { NextResponse } from "next/server";
import { updateLessonVisibility } from "../../../../lib/data/lessons";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    id?: string;
    visibility?: "private" | "public";
  };

  if (!payload?.id || !payload?.visibility) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await updateLessonVisibility(payload.id, payload.visibility);
  return NextResponse.json({ status: "ok" });
}
