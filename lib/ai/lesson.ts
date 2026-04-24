import OpenAI from "openai";
import type {
  LessonGenerationInput,
  LessonGenerationOutput,
  LessonSourceMeta,
} from "../../types/lesson";
import { normalizeLessonOutput } from "../validators/lesson";

export async function generateLesson(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY_MISSING");
  }

  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 4096,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You design Business English lessons. Output must be strict JSON only and must follow all counts exactly.",
      },
      { role: "user", content: prompt },
    ],
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

export async function repairLesson(prompt: string): Promise<string> {
  return generateLesson(prompt);
}

function truncateSourceText(value: string, maxLength = 12000): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}\n\n[Truncated source excerpt for token limits]`;
}

export function buildLessonPrompt(params: {
  input: LessonGenerationInput;
  sourceText: string;
  sourceKind: LessonSourceMeta["source_kind"];
  videoId?: string | null;
}): string {
  const { input, sourceText, sourceKind, videoId } = params;

  return [
    "Create one Business English lesson strictly grounded in the provided source.",
    "Do not invent facts, names, metrics, or events that are not supported by the source text.",
    "If the source is incomplete, keep language generic and avoid unsupported details.",
    "Keep all tasks on topic and anchored to source facts and vocabulary.",
    "Use the selected industry and profession as practical context across the lesson.",
    "Make the lesson professionally useful for realistic workplace communication tasks.",
    "Do not omit required sections.",
    "Do not return partial lessons.",
    "",
    "Return exactly one JSON object using this schema:",
    JSON.stringify(
      {
        title: "string",
        summary: "string",
        objectives: ["string", "string", "string"],
        word_bank: [
          { term: "string", definition: "string" },
          "... exactly 12 items total",
        ],
        reading_text:
          "string with at least 3 substantial paragraphs and blank lines between paragraphs",
        reading_comprehension: [
          {
            id: "rc1",
            question: "string",
            options: ["A", "B", "C", "D"],
            correct_index: 0,
          },
          "... exactly 8 items total",
        ],
        vocabulary_exercise: [
          {
            id: "ve1",
            question: "string tied to word_bank and reading_text",
            options: ["A", "B", "C", "D"],
            correct_index: 0,
          },
          "... at least 8 items",
        ],
        grammar: [
          {
            id: "gr1",
            question: "string tied directly to the lesson source",
            options: ["A", "B", "C", "D"],
            correct_index: 0,
          },
          "... exactly 8 items total",
        ],
        listening:
          "string listening activity. If source is article/raw text, provide a practical listening adaptation or teacher-use prompt and do not reference a fake audio file.",
        final_assessment: [
          {
            id: "fa1",
            question: "string on topic",
            options: ["A", "B", "C", "D"],
            correct_index: 0,
          },
          "... at least 15 items",
        ],
      },
      null,
      2
    ),
    "",
    "Hard constraints:",
    "- Return all required sections in one complete JSON response.",
    "- word_bank: exactly 12 items.",
    "- reading_text: at least 3 substantial paragraphs separated by blank lines.",
    "- reading_comprehension: exactly 8 questions.",
    "- vocabulary_exercise: must exist and be tied to word_bank and reading_text.",
    "- grammar: exactly 8 questions tied directly to source content.",
    "- final_assessment: at least 15 questions and must remain on the same source topic.",
    "- Every question must include exactly 4 options and a valid 0-based correct_index.",
    "- Use only source-derived vocabulary when possible.",
    "- Keep CEFR level alignment for wording and complexity.",
    "- Make summary include practical professional application aligned to selected role/context.",
    "- Make objectives action-oriented and workplace-relevant for selected profession/industry.",
    "- Make reading_text read like a realistic workplace scenario for the selected role while staying source-grounded.",
    "- Make vocabulary_exercise questions use business/professional usage contexts from the lesson topic.",
    "- Make grammar questions about realistic professional communication (emails, meetings, updates, negotiations) tied to the lesson topic.",
    "- Make final_assessment include workplace application questions, not generic language trivia.",
    "- If profession/industry are provided, naturally reference them with phrasing such as: For a [profession], in [industry], in a client meeting, in a project update, in a professional email.",
    "",
    `Topic: ${input.topic || "N/A"}`,
    `Level: ${input.level}`,
    `Industry: ${input.industry || "N/A"}`,
    `Profession: ${input.profession || "N/A"}`,
    `Lesson type: ${input.lesson_type}`,
    `Source kind: ${sourceKind}`,
    `Video ID: ${videoId || "N/A"}`,
    "",
    "Source text (authoritative grounding material):",
    truncateSourceText(sourceText),
  ].join("\n");
}

export function buildLessonRepairPrompt(params: {
  input: LessonGenerationInput;
  sourceText: string;
  sourceKind: LessonSourceMeta["source_kind"];
  videoId?: string | null;
  brokenLesson: unknown;
  validationErrors: string[];
}): string {
  const {
    input,
    sourceText,
    sourceKind,
    videoId,
    brokenLesson,
    validationErrors,
  } = params;

  return [
    "Repair this malformed Business English lesson JSON.",
    "Return one complete JSON lesson object in the required schema.",
    "Do not return explanations.",
    "Do not omit sections.",
    "Fix every listed validation error.",
    "Preserve source-grounding and keep workplace/professional usefulness aligned to the selected industry and profession.",
    "",
    "Validation errors to fix:",
    ...validationErrors.map((item) => `- ${item}`),
    "",
    "Required schema and rules:",
    "- word_bank: exactly 12 items.",
    "- reading_text: at least 3 substantial paragraphs separated by blank lines.",
    "- reading_comprehension: exactly 8 questions.",
    "- vocabulary_exercise: must exist.",
    "- grammar: exactly 8 questions and source-grounded.",
    "- final_assessment: at least 15 questions.",
    "- listening is optional for now.",
    "- Every question must have 4 options and a valid correct_index.",
    "- Keep summary, objectives, reading_text, grammar, vocabulary_exercise, and final_assessment professionally relevant to selected industry/profession when provided.",
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
    truncateSourceText(sourceText),
    "",
    "Malformed lesson JSON to repair:",
    JSON.stringify(brokenLesson ?? {}, null, 2),
  ].join("\n");
}

export function validateLessonOutput(
  value: unknown
): { ok: true; data: LessonGenerationOutput } | { ok: false; error: string } {
  const normalized = normalizeLessonOutput(value, { strict: true });
  if (!normalized.ok) {
    return { ok: false, error: normalized.errors.join(" ") };
  }

  return { ok: true, data: normalized.data };
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

export function parseLessonJson(raw: string): unknown | null {
  try {
    const stripped = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    return JSON.parse(stripped) as unknown;
  } catch {
    return null;
  }
}
