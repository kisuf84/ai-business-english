import type { CourseGenerationInput } from "../../types/course";

type ValidationResult = {
  ok: boolean;
  errors: string[];
};

export function validateCoursePayload(
  payload: CourseGenerationInput
): ValidationResult {
  const errors: string[] = [];

  if (!payload.topic?.trim()) {
    errors.push("Topic is required.");
  }

  if (!payload.level?.trim()) {
    errors.push("Level is required.");
  }

  if (
    payload.number_of_modules !== undefined &&
    (!Number.isFinite(payload.number_of_modules) ||
      !Number.isInteger(payload.number_of_modules) ||
      payload.number_of_modules < 1 ||
      payload.number_of_modules > 12)
  ) {
    errors.push("Number of modules must be between 1 and 12.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
