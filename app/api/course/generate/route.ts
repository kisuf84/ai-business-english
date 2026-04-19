import { NextResponse } from "next/server";
import type {
  CourseGenerationInput,
  CourseGenerationOutput,
} from "../../../../types/course";
import { validateCoursePayload } from "../../../../lib/validators/course";
import { createCourse } from "../../../../lib/data/courses";

const REQUIRED_FIELDS_ERROR = "Please complete all required fields";
const PROCESSING_ERROR = "We couldn’t process your request. Try again.";

function mockCourseResponse(
  input: CourseGenerationInput
): CourseGenerationOutput {
  const count = input.number_of_modules ?? 4;
  const modules = Array.from({ length: count }, (_, index) => ({
    title: `Module ${index + 1}: ${input.topic}`,
    description: `Core skills and vocabulary for ${input.topic}.`,
    lessons: [
      `Lesson ${index + 1}.1: Key concepts`,
      `Lesson ${index + 1}.2: Practice and scenarios`,
    ],
  }));

  return {
    course_title: `Business English Course: ${input.topic}`,
    summary:
      "A structured course that builds practical workplace communication skills.",
    modules,
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CourseGenerationInput;
    const normalizedPayload: CourseGenerationInput = {
      topic: payload.topic?.trim() || "",
      level: payload.level?.trim() || "",
      industry: payload.industry?.trim() || undefined,
      profession: payload.profession?.trim() || undefined,
      number_of_modules:
        payload.number_of_modules === undefined
          ? undefined
          : Number(payload.number_of_modules),
    };

    const validation = validateCoursePayload(normalizedPayload);

    if (!validation.ok) {
      return NextResponse.json(
        { error: REQUIRED_FIELDS_ERROR, details: validation.errors },
        { status: 400 }
      );
    }

    const output = mockCourseResponse(normalizedPayload);
    await createCourse({
      input: normalizedPayload,
      output,
      user_id: null,
    });

    return NextResponse.json(output);
  } catch {
    return NextResponse.json(
      { error: PROCESSING_ERROR },
      { status: 500 }
    );
  }
}
