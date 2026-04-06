import OpenAI from "openai";
import type {
  LessonGenerationInput,
  LessonGenerationOutput,
  LessonQuestion,
  VocabularyItem,
} from "../../types/lesson";

export async function generateLesson(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY_MISSING");
  }

  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 4096,
    messages: [
      {
        role: "system",
        content:
          "You are an expert Business English curriculum designer. Return only valid JSON.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
  });

  const text = response.choices
    .map((choice) => choice.message?.content ?? "")
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("OPENAI_EMPTY_RESPONSE");
  }

  return text;
}

function isVocabularyItem(value: unknown): value is VocabularyItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.term === "string" && typeof item.definition === "string";
}

function isLessonQuestion(value: unknown): value is LessonQuestion {
  if (!value || typeof value !== "object") return false;
  const q = value as Record<string, unknown>;
  const correctIndex =
    typeof q.correct_index === "number"
      ? (q.correct_index as number)
      : typeof q.correct === "number"
        ? (q.correct as number)
        : -1;
  return (
    typeof q.id === "string" &&
    typeof q.question === "string" &&
    Array.isArray(q.options) &&
    (q.options as unknown[]).every((o) => typeof o === "string") &&
    correctIndex >= 0 &&
    correctIndex < (q.options as unknown[]).length
  );
}

export function buildLessonPrompt(params: {
  input: LessonGenerationInput;
  sourceText: string;
  sourceKind: "youtube_transcript" | "manual";
  videoId?: string | null;
}): string {
  const { input, sourceText, sourceKind, videoId } = params;

  return [
    "You are an expert Business English curriculum designer.",
    "Respond ONLY with a valid JSON object. No markdown, no backticks, no preamble.",
    "",
    "The JSON must match this exact structure:",
    JSON.stringify(
      {
        title: "string",
        summary: "string",
        objectives: ["string (3 items)"],
        vocabulary: [
          { term: "string", definition: "string" },
          "5 items total",
        ],
        reading_text: "string (150-250 words)",
        comprehension_questions: [
          {
            id: "cq1",
            question: "string",
            options: ["A", "B", "C", "D"],
            correct_index: 0,
          },
          "8 items total",
        ],
        grammar_exercises: [
          {
            id: "ge1",
            question: "string",
            options: ["A", "B", "C", "D"],
            correct_index: 0,
            instruction: "string (optional)",
            sentence: "string (optional)",
          },
          "8 items total",
        ],
        role_play: "string",
        quiz: [
          {
            id: "q1",
            question: "string",
            options: ["A", "B", "C", "D"],
            correct_index: 0,
          },
          "5 items total",
        ],
      },
      null,
      2
    ),
    "",
    "Rules:",
    "- vocabulary: exactly 5 objects with term and definition strings",
    "- comprehension_questions: exactly 8 objects; ids cq1 through cq8",
    "- grammar_exercises: exactly 8 objects; ids ge1 through ge8",
    "- quiz: exactly 5 objects; ids q1, q2, q3, q4, q5",
    "- Every question object must use correct_index (not correct) as a valid 0-based index into the options array",
    "- Maintain CEFR level strictly for vocabulary, sentence complexity, and question wording",
    "- All exercises must directly reference the lesson topic and source context",
    "- Use topic vocabulary in both comprehension and grammar questions",
    "- Grammar exercises must reinforce grammar structures used in the reading text",
    "- All content must be directly relevant to the source material below",
    "- Keep output practical and workplace-focused",
    "",
    `Topic: ${input.topic || "N/A"}`,
    `Level: ${input.level}`,
    `Industry: ${input.industry || "N/A"}`,
    `Profession: ${input.profession || "N/A"}`,
    `Lesson type: ${input.lesson_type}`,
    `Source kind: ${sourceKind}`,
    `Video ID: ${videoId || "N/A"}`,
    "",
    "Source text:",
    sourceText,
  ].join("\n");
}

export function validateLessonOutput(
  value: unknown
): { ok: true; data: LessonGenerationOutput } | { ok: false; error: string } {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Output must be an object." };
  }

  const data = value as Record<string, unknown>;

  if (typeof data.title !== "string") {
    return { ok: false, error: "Missing or invalid title." };
  }
  if (typeof data.summary !== "string") {
    return { ok: false, error: "Missing or invalid summary." };
  }
  if (
    !Array.isArray(data.objectives) ||
    !data.objectives.every((o) => typeof o === "string")
  ) {
    return { ok: false, error: "objectives must be a string array." };
  }
  if (
    !Array.isArray(data.vocabulary) ||
    !data.vocabulary.every(isVocabularyItem)
  ) {
    return {
      ok: false,
      error: "vocabulary must be an array of {term, definition} objects.",
    };
  }
  if (typeof data.reading_text !== "string") {
    return { ok: false, error: "Missing or invalid reading_text." };
  }
  if (
    !Array.isArray(data.comprehension_questions) ||
    !data.comprehension_questions.every(isLessonQuestion)
  ) {
    return {
      ok: false,
      error:
        "comprehension_questions must be an array of question objects with id, question, options, correct_index.",
    };
  }
  if (data.comprehension_questions.length !== 8) {
    return { ok: false, error: "comprehension_questions must contain exactly 8 items." };
  }
  if (
    !Array.isArray(data.grammar_exercises) ||
    !data.grammar_exercises.every(isLessonQuestion)
  ) {
    return {
      ok: false,
      error:
        "grammar_exercises must be an array of question objects with id, question, options, correct_index.",
    };
  }
  if (data.grammar_exercises.length !== 8) {
    return { ok: false, error: "grammar_exercises must contain exactly 8 items." };
  }
  if (typeof data.role_play !== "string") {
    return { ok: false, error: "Missing or invalid role_play." };
  }
  if (!Array.isArray(data.quiz) || !data.quiz.every(isLessonQuestion)) {
    return {
      ok: false,
      error:
        "quiz must be an array of question objects with id, question, options, correct_index.",
    };
  }

  const normalizeQuestion = (question: Record<string, unknown>): LessonQuestion => ({
    id: question.id as string,
    question: question.question as string,
    options: question.options as string[],
    correct_index:
      typeof question.correct_index === "number"
        ? question.correct_index
        : (question.correct as number),
    instruction:
      typeof question.instruction === "string" ? question.instruction : undefined,
    sentence: typeof question.sentence === "string" ? question.sentence : undefined,
  });

  return {
    ok: true,
    data: {
      title: data.title,
      summary: data.summary,
      objectives: data.objectives as string[],
      vocabulary: data.vocabulary as VocabularyItem[],
      reading_text: data.reading_text,
      comprehension_questions: (data.comprehension_questions as Record<string, unknown>[]).map(
        normalizeQuestion
      ),
      grammar_exercises: (data.grammar_exercises as Record<string, unknown>[]).map(
        normalizeQuestion
      ),
      role_play: data.role_play,
      quiz: (data.quiz as Record<string, unknown>[]).map(normalizeQuestion),
    },
  };
}

export function parseAndValidateLessonOutput(
  raw: string
): { ok: true; data: LessonGenerationOutput } | { ok: false; error: string } {
  try {
    const stripped = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    const parsed = JSON.parse(stripped) as unknown;
    return validateLessonOutput(parsed);
  } catch {
    return { ok: false, error: "Model output is not valid JSON." };
  }
}
