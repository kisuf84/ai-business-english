import type {
  LessonGenerationInput,
  LessonGenerationOutput,
  LessonQuestion,
  VocabularyItem,
} from "../../types/lesson";

type ValidationResult = {
  ok: boolean;
  errors: string[];
};

export function validateLessonPayload(
  payload: LessonGenerationInput
): ValidationResult {
  const errors: string[] = [];

  const hasTopic = Boolean(payload.topic?.trim());
  const hasSourceUrl = Boolean(payload.source_url?.trim());
  const hasSourceText = Boolean(payload.source_text?.trim());

  if (!hasTopic && !hasSourceUrl && !hasSourceText) {
    errors.push("Topic, source URL, or source text is required.");
  }

  if (!payload.level?.trim()) {
    errors.push("Level is required.");
  }

  if (!payload.lesson_type?.trim()) {
    errors.push("Lesson type is required.");
  }

  if (hasSourceUrl) {
    try {
      const parsed = new URL(payload.source_url as string);
      if (!parsed.protocol.startsWith("http")) {
        errors.push("Source URL must be a valid URL.");
      }
    } catch {
      errors.push("Source URL must be a valid URL.");
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => isNonEmptyString(item))
  );
}

function isNonEmptyVocabularyArray(value: unknown): value is VocabularyItem[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        isNonEmptyString((item as Record<string, unknown>).term) &&
        isNonEmptyString((item as Record<string, unknown>).definition)
    )
  );
}

function isNonEmptyQuestionArray(value: unknown): value is LessonQuestion[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => {
      if (!item || typeof item !== "object") return false;
      const q = item as Record<string, unknown>;
      const options = q.options as unknown[];
      const correctIndex =
        typeof q.correct_index === "number"
          ? (q.correct_index as number)
          : typeof q.correct === "number"
            ? (q.correct as number)
            : -1;
      return (
        isNonEmptyString(q.id) &&
        isNonEmptyString(q.question) &&
        Array.isArray(q.options) &&
        options.length > 0 &&
        options.every((o) => isNonEmptyString(o)) &&
        correctIndex >= 0 &&
        correctIndex < options.length
      );
    })
  );
}

export function validateLessonOutputPayload(
  payload: LessonGenerationOutput
): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(payload.title)) {
    errors.push("Title is required.");
  }

  if (!isNonEmptyString(payload.summary)) {
    errors.push("Summary is required.");
  }

  if (!isNonEmptyStringArray(payload.objectives)) {
    errors.push("Learning objectives are required.");
  }

  if (!isNonEmptyVocabularyArray(payload.vocabulary)) {
    errors.push("Vocabulary list is required.");
  }

  if (!isNonEmptyString(payload.reading_text)) {
    errors.push("Reading text is required.");
  }

  if (!isNonEmptyQuestionArray(payload.comprehension_questions)) {
    errors.push("Comprehension questions are required.");
  } else if (payload.comprehension_questions.length !== 8) {
    errors.push("Comprehension questions must contain exactly 8 MCQs.");
  }

  if (!isNonEmptyQuestionArray(payload.grammar_exercises)) {
    errors.push("Grammar exercises are required.");
  } else if (payload.grammar_exercises.length !== 8) {
    errors.push("Grammar exercises must contain exactly 8 MCQs.");
  }

  if (!isNonEmptyString(payload.role_play)) {
    errors.push("Role play scenario is required.");
  }

  if (!isNonEmptyQuestionArray(payload.quiz)) {
    errors.push("Quiz questions are required.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
