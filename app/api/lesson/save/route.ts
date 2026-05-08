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
import { getRequestAuthUser } from "../../../../lib/supabase/auth";

const REQUIRED_FIELDS_ERROR = "Please complete all required fields";
const PROCESSING_ERROR = "We couldn’t process your request. Try again.";

export async function POST(request: Request) {
  const authUser = await getRequestAuthUser(request);
  console.info("[lesson/save] auth_check", {
    authResolved: Boolean(authUser),
    userId: authUser?.id ?? null,
    hasBearerToken: Boolean(authUser?.access_token),
  });
  if (!authUser) {
    console.error("[lesson/save] auth_failed");
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

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
      {
        error: "Lesson content is incomplete. Please regenerate before saving.",
        details: outputValidation.errors,
      },
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
      user_id: authUser.id,
    });

    console.info("[lesson/save] save_success", {
      userId: authUser.id,
      lessonId: lesson.id,
      lessonUrl: `/lessons/${lesson.id}`,
      insertPayloadKeys: [
        "user_id",
        "title",
        "topic",
        "level",
        "industry",
        "profession",
        "lesson_type",
        "source_url",
        "content_json",
        "status",
        "visibility",
        "video_id",
        "transcript_text",
        "transcript_segments",
      ],
    });

    return NextResponse.json({
      id: lesson.id,
      lesson_id: lesson.id,
      lesson_url: `/lessons/${lesson.id}`,
    });
  } catch (error) {
    console.error("[lesson/save] Failed to save lesson", {
      authResolved: true,
      user_id: authUser.id,
      hasBearerToken: Boolean(authUser.access_token),
      topic: payload.input.topic,
      level: payload.input.level,
      source_url: payload.input.source_url ? "provided" : "not_provided",
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json(
      { error: "Lesson save failed. Please try again." },
      { status: 500 }
    );
  }
}
