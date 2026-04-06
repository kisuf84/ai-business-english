import { NextResponse } from "next/server";
import { duplicateLesson } from "../../../../lib/data/lessons";

export async function POST(request: Request) {
  const payload = (await request.json()) as { id?: string };

  if (!payload?.id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const duplicated = await duplicateLesson(payload.id);

  if (!duplicated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ id: duplicated.id });
}
