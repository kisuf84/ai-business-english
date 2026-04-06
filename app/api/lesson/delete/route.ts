import { NextResponse } from "next/server";
import { deleteLesson } from "../../../../lib/data/lessons";

export async function POST(request: Request) {
  const payload = (await request.json()) as { id?: string };

  if (!payload?.id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await deleteLesson(payload.id);
  return NextResponse.json({ status: "ok" });
}
