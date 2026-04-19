import { NextResponse } from "next/server";
import { updateLessonVisibility } from "../../../../lib/data/lessons";

const REQUIRED_FIELDS_ERROR = "Please complete all required fields";
const PROCESSING_ERROR = "We couldn’t process your request. Try again.";

export async function POST(request: Request) {
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

  await updateLessonVisibility(payload.id, payload.visibility);
  return NextResponse.json({ status: "ok" });
}
