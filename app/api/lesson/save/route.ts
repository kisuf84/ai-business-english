import { NextResponse } from "next/server";
import type {
  LessonGenerationInput,
  LessonGenerationOutput,
} from "../../../../types/lesson";
import { createLesson } from "../../../../lib/data/lessons";
import {
  normalizeLessonOutput,
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
<<<<<<< HEAD
      { error: PROCESSING_ERROR, details: outputValidation.errors },
=======
      {
        error: "Lesson content is incomplete. Please regenerate before saving.",
        details: outputValidation.errors,
      },
>>>>>>> 2788ed7 (enforce lesson schema with repair pass and strict validation)
      { status: 400 }
    );
  }

  try {
    const normalizedOutput = normalizeLessonOutput(payload.output, { strict: true });
    if (!normalizedOutput.ok) {
      return NextResponse.json(
        {
          error: "Lesson structure is invalid and could not be saved.",
          details: normalizedOutput.errors,
        },
        { status: 400 }
      );
    }

    const lesson = await createLesson({
      input: payload.input,
      output: normalizedOutput.data,
      user_id: null,
    });

<<<<<<< HEAD
    return NextResponse.json({ lesson, id: lesson.id });
  } catch (error) {
    console.error("[lesson/save] Failed to save lesson:", error);
    return NextResponse.json(
      { error: PROCESSING_ERROR },
=======
    return NextResponse.json({
      id: lesson.id,
      lesson_id: lesson.id,
      lesson_url: `/lessons/${lesson.id}`,
    });
  } catch (error) {
    console.error("[lesson/save] Failed to save lesson", {
      topic: payload.input.topic,
      level: payload.input.level,
      source_url: payload.input.source_url ? "provided" : "not_provided",
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json(
      { error: "Lesson save failed. Please try again." },
>>>>>>> 2788ed7 (enforce lesson schema with repair pass and strict validation)
      { status: 500 }
    );
  }
}
