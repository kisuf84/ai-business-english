import { NextResponse } from "next/server";
import type {
  LessonGenerationInput,
  LessonGenerationOutput,
} from "../../../../types/lesson";
import { createLesson } from "../../../../lib/data/lessons";
import {
  validateLessonOutputPayload,
  validateLessonPayload,
} from "../../../../lib/validators/lesson";

export async function POST(request: Request) {
  let payload: {
    input: LessonGenerationInput;
    output: LessonGenerationOutput;
  };

  try {
    payload = (await request.json()) as {
      input: LessonGenerationInput;
      output: LessonGenerationOutput;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !payload?.input ||
    !payload?.output ||
    typeof payload.input !== "object"
  ) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  const inputValidation = validateLessonPayload(payload.input);
  if (!inputValidation.ok) {
    return NextResponse.json(
      { error: "Invalid lesson input payload", details: inputValidation.errors },
      { status: 400 }
    );
  }

  const outputValidation = validateLessonOutputPayload(payload.output);
  if (!outputValidation.ok) {
    return NextResponse.json(
      { error: "Invalid lesson output payload", details: outputValidation.errors },
      { status: 400 }
    );
  }

  try {
    const lesson = await createLesson({
      input: payload.input,
      output: payload.output,
      user_id: null,
    });

    return NextResponse.json({ id: lesson.id });
  } catch {
    return NextResponse.json(
      { error: "Failed to save lesson." },
      { status: 500 }
    );
  }
}
