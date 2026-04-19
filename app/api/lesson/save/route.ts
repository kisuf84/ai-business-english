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

const REQUIRED_FIELDS_ERROR = "Please complete all required fields";
const PROCESSING_ERROR = "We couldn’t process your request. Try again.";

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
    return NextResponse.json({ error: PROCESSING_ERROR }, { status: 400 });
  }

  if (
    !payload?.input ||
    !payload?.output ||
    typeof payload.input !== "object" ||
    typeof payload.output !== "object"
  ) {
    return NextResponse.json(
      { error: REQUIRED_FIELDS_ERROR },
      { status: 400 }
    );
  }

  const inputValidation = validateLessonPayload(payload.input);
  if (!inputValidation.ok) {
    return NextResponse.json(
      { error: REQUIRED_FIELDS_ERROR, details: inputValidation.errors },
      { status: 400 }
    );
  }

  const outputValidation = validateLessonOutputPayload(payload.output);
  if (!outputValidation.ok) {
    return NextResponse.json(
      { error: PROCESSING_ERROR, details: outputValidation.errors },
      { status: 400 }
    );
  }

  try {
    const lesson = await createLesson({
      input: payload.input,
      output: payload.output,
      user_id: null,
    });

    return NextResponse.json({ lesson, id: lesson.id });
  } catch (error) {
    console.error("[lesson/save] Failed to save lesson:", error);
    return NextResponse.json(
      { error: PROCESSING_ERROR },
      { status: 500 }
    );
  }
}
