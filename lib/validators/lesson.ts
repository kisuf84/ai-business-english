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

type NormalizeOptions = {
  strict?: boolean;
  allowLegacyFields?: boolean;
};

type NormalizeResult =
  | { ok: true; data: LessonGenerationOutput; warnings: string[] }
  | { ok: false; errors: string[] };

const REQUIRED_WORD_BANK_COUNT = 12;
const REQUIRED_READING_COMPREHENSION_COUNT = 8;
const REQUIRED_GRAMMAR_COUNT = 8;
const MIN_VOCAB_EXERCISE_COUNT = 1;
const MIN_FINAL_ASSESSMENT_COUNT = 15;
const MIN_READING_PARAGRAPH_LENGTH = 220;

export function validateLessonPayload(
  payload: LessonGenerationInput
): ValidationResult {
  const errors: string[] = [];

  const hasTopic = Boolean(payload.topic?.trim());
  const hasSourceUrl = Boolean(payload.source_url?.trim());
  const hasSourceText = Boolean(payload.source_text?.trim());

<<<<<<< HEAD
  if (!hasTopic && !hasSourceUrl && !hasSourceText) {
    errors.push("Topic, source URL, or source text is required.");
=======
  if (!hasTopic && !hasSourceUrl) {
    errors.push("Add a topic or a source URL to generate a lesson.");
>>>>>>> 2788ed7 (enforce lesson schema with repair pass and strict validation)
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
        errors.push("Source URL must start with http:// or https://.");
      }
    } catch {
      errors.push("Source URL is not valid.");
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function toVocabularyArray(value: unknown): VocabularyItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const term = toNonEmptyString(row.term);
    const definition = toNonEmptyString(row.definition);
    if (!term || !definition) return [];
    return [{ term, definition } satisfies VocabularyItem];
  });
}

function toQuestionArray(value: unknown, idPrefix: string): LessonQuestion[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;

    const id = toNonEmptyString(row.id) ?? `${idPrefix}${index + 1}`;
    const question =
      toNonEmptyString(row.question) ?? toNonEmptyString(row.prompt) ?? null;
    const options = Array.isArray(row.options)
      ? row.options
          .map((opt) => (typeof opt === "string" ? opt.trim() : ""))
          .filter((opt) => opt.length > 0)
      : [];

    const rawCorrectIndex =
      typeof row.correct_index === "number"
        ? row.correct_index
        : typeof row.correct === "number"
          ? row.correct
          : -1;

    const validCorrectIndex =
      Number.isInteger(rawCorrectIndex) &&
      rawCorrectIndex >= 0 &&
      rawCorrectIndex < options.length;

    if (!question || options.length < 2 || !validCorrectIndex) {
      return [];
    }

    return [
      {
        id,
        question,
        options,
        correct_index: rawCorrectIndex,
        instruction: toNonEmptyString(row.instruction) ?? undefined,
        sentence: toNonEmptyString(row.sentence) ?? undefined,
      } satisfies LessonQuestion,
    ];
  });
}

function splitParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function ensureParagraphBreaks(text: string): string {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return "";

  const paragraphs = splitParagraphs(cleaned);
  if (paragraphs.length >= 3) {
    return cleaned;
  }

  const sentences = cleaned.match(/[^.!?]+[.!?]?/g)?.map((item) => item.trim()) ?? [];
  if (sentences.length < 3) {
    return cleaned;
  }

  const chunkSize = Math.ceil(sentences.length / 3);
  const rebuilt: string[] = [];
  for (let i = 0; i < sentences.length; i += chunkSize) {
    rebuilt.push(sentences.slice(i, i + chunkSize).join(" ").trim());
  }

  return rebuilt.filter(Boolean).join("\n\n");
}

function getField<T = unknown>(data: Record<string, unknown>, ...keys: string[]): T | null {
  for (const key of keys) {
    if (data[key] !== undefined) {
      return data[key] as T;
    }
  }
  return null;
}

function getTopicTokens(title: string, wordBank: VocabularyItem[]): Set<string> {
  const tokens = new Set<string>();
  for (const part of `${title} ${wordBank.map((item) => item.term).join(" ")}`.split(/\W+/)) {
    const token = part.trim().toLowerCase();
    if (token.length >= 4) {
      tokens.add(token);
    }
  }
  return tokens;
}

function isGrammarTopicGrounded(
  grammar: LessonQuestion[],
  title: string,
  wordBank: VocabularyItem[]
): boolean {
  if (grammar.length === 0) return false;
  const topicTokens = getTopicTokens(title, wordBank);
  if (topicTokens.size === 0) return true;

  let groundedCount = 0;
  for (const question of grammar) {
    const haystack = `${question.question} ${(question.options || []).join(" ")}`.toLowerCase();
    const hasTopicToken = Array.from(topicTokens).some((token) => haystack.includes(token));
    if (hasTopicToken) {
      groundedCount += 1;
    }
  }
  return groundedCount >= Math.max(2, Math.floor(grammar.length / 3));
}

export function normalizeLessonOutput(
  payload: unknown,
  options: NormalizeOptions = {}
): NormalizeResult {
  const strict = options.strict ?? true;
  const allowLegacyFields = options.allowLegacyFields ?? false;
  if (!payload || typeof payload !== "object") {
    return { ok: false, errors: ["Lesson output must be a JSON object."] };
  }

  const data = payload as Record<string, unknown>;
  const warnings: string[] = [];

  const title = toNonEmptyString(data.title) ?? "Business English Lesson";
  const summary = toNonEmptyString(data.summary) ?? "";
  const objectives = toStringArray(data.objectives);

  const wordBank = toVocabularyArray(
    allowLegacyFields
      ? getField(data, "word_bank", "wordBank", "vocabulary")
      : getField(data, "word_bank", "wordBank")
  );

  const readingText = ensureParagraphBreaks(
    toNonEmptyString(getField(data, "reading_text", "readingText")) ?? ""
  );

  const readingComprehension = toQuestionArray(
    allowLegacyFields
      ? getField(
          data,
          "reading_comprehension",
          "readingComprehension",
          "comprehension_questions"
        )
      : getField(data, "reading_comprehension", "readingComprehension"),
    "rc"
  );

  const vocabularyExercise = toQuestionArray(
    allowLegacyFields
      ? getField(data, "vocabulary_exercise", "vocabularyExercise", "vocabulary_practice")
      : getField(data, "vocabulary_exercise", "vocabularyExercise"),
    "ve"
  );

  const grammar = toQuestionArray(
    allowLegacyFields
      ? getField(data, "grammar", "grammar_exercises", "grammarExercises")
      : getField(data, "grammar", "grammarExercises"),
    "gr"
  );

  const listening = toNonEmptyString(
    allowLegacyFields
      ? getField(data, "listening", "listening_prompt", "role_play")
      : getField(data, "listening", "listening_prompt")
  );

  const finalAssessment = toQuestionArray(
    allowLegacyFields
      ? getField(data, "final_assessment", "finalAssessment", "quiz")
      : getField(data, "final_assessment", "finalAssessment"),
    "fa"
  );

  const normalized: LessonGenerationOutput = {
    title,
    summary,
    objectives,
    word_bank: wordBank,
    reading_text: readingText,
    reading_comprehension: readingComprehension,
    vocabulary_exercise: vocabularyExercise,
    grammar,
    listening: listening ?? "",
    final_assessment: finalAssessment,
  };

  const errors: string[] = [];

  if (!toNonEmptyString(normalized.title)) {
    errors.push("Title is required.");
  }
  if (!toNonEmptyString(normalized.summary)) {
    errors.push("Summary is required.");
  }
  const readingParagraphs = splitParagraphs(normalized.reading_text);

  if (strict) {
    if (normalized.objectives.length < 3) {
      errors.push("Learning objectives must contain at least 3 items.");
    }
    if (normalized.word_bank.length !== REQUIRED_WORD_BANK_COUNT) {
      errors.push(`Word Bank must contain exactly ${REQUIRED_WORD_BANK_COUNT} vocabulary cards.`);
    }
    if (readingParagraphs.length < 3) {
      errors.push("Reading Text must contain at least 3 paragraphs.");
    }
    if (
      readingParagraphs.length >= 3 &&
      readingParagraphs.some((paragraph) => paragraph.length < MIN_READING_PARAGRAPH_LENGTH)
    ) {
      errors.push("Each Reading Text paragraph must be substantial for reading practice.");
    }
    if (normalized.reading_comprehension.length !== REQUIRED_READING_COMPREHENSION_COUNT) {
      errors.push(
        `Reading Comprehension must contain exactly ${REQUIRED_READING_COMPREHENSION_COUNT} questions.`
      );
    }
    if (normalized.vocabulary_exercise.length < MIN_VOCAB_EXERCISE_COUNT) {
      errors.push("Vocabulary Exercise must exist.");
    }
    if (normalized.grammar.length !== REQUIRED_GRAMMAR_COUNT) {
      errors.push(`Grammar must contain exactly ${REQUIRED_GRAMMAR_COUNT} questions.`);
    }
    if (!isGrammarTopicGrounded(normalized.grammar, normalized.title, normalized.word_bank)) {
      errors.push("Grammar questions must stay tied to the lesson/source topic.");
    }
    if (normalized.final_assessment.length < MIN_FINAL_ASSESSMENT_COUNT) {
      errors.push(
        `Final Assessment must contain at least ${MIN_FINAL_ASSESSMENT_COUNT} questions.`
      );
    }
  } else {
    if (normalized.objectives.length === 0) {
      errors.push("Learning objectives are missing.");
    }
    if (normalized.word_bank.length === 0) {
      errors.push("Word Bank is missing.");
    }
    if (readingParagraphs.length === 0) {
      errors.push("Reading Text is missing.");
    }
    if (normalized.reading_comprehension.length === 0) {
      errors.push("Reading Comprehension is missing.");
    }
    if (normalized.vocabulary_exercise.length === 0) {
      errors.push("Vocabulary Exercise is missing.");
    }
    if (normalized.grammar.length === 0) {
      errors.push("Grammar is missing.");
    }
    if (normalized.final_assessment.length === 0) {
      errors.push("Final Assessment is missing.");
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data: normalized, warnings };
}

export function validateLessonOutputPayload(
  payload: LessonGenerationOutput
): ValidationResult {
<<<<<<< HEAD
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
=======
  const normalized = normalizeLessonOutput(payload, { strict: true });
  return normalized.ok
    ? { ok: true, errors: [] }
    : { ok: false, errors: normalized.errors };
>>>>>>> 2788ed7 (enforce lesson schema with repair pass and strict validation)
}
