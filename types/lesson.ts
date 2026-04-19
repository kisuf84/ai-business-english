export type LessonGenerationInput = {
  topic: string;
  source_url?: string;
  level: string;
  industry?: string;
  profession?: string;
  lesson_type: string;
};

export type MCQ = {
  id: string;
  question: string;
  options: string[];
  correct_index: number; // index of correct option
  instruction?: string; // for grammar exercises
  sentence?: string; // for grammar fill-in-the-blank
};

export type LessonQuestion = MCQ;

export type VocabularyItem = {
  term: string;
  definition: string;
};

export type LessonGenerationOutput = {
  title: string;
  summary: string;
  objectives: string[];
  vocabulary: VocabularyItem[];
  reading_text: string;
  comprehension_questions: MCQ[];
  grammar_exercises: MCQ[];
  role_play: string;
  quiz: MCQ[];
};

export type LessonSourceMeta = {
  source_kind: "youtube_transcript" | "manual";
  source_url?: string | null;
  video_id?: string | null;
  transcript_language?: string | null;
};

export type LessonGenerationApiResponse = LessonGenerationOutput & {
  status?: "ready" | "still_processing";
  source_meta?: LessonSourceMeta;
};

export type LessonGenerationRequestInput = LessonGenerationInput & {
  manual_source_text?: string;
};

export type LessonGenerationApiErrorCode =
  | "invalid_payload"
  | "invalid_source_url"
  | "invalid_url"
  | "no_captions"
  | "captions_disabled"
  | "transcript_fetch_failed"
  | "unsupported_video"
  | "unknown_error"
  | "generation_failed";

export type LessonGenerationApiError = {
  status?: "still_processing" | "needs_transcript" | "failed";
  error: string;
  message?: string;
  error_code: LessonGenerationApiErrorCode;
  details?: string[];
};

export type LessonRecord = {
  id: string;
  user_id: string | null;
  title: string;
  topic: string;
  level: string;
  industry: string | null;
  profession: string | null;
  lesson_type: string;
  source_url: string | null;
  content_json: LessonGenerationOutput;
  status: "saved" | "draft" | "archived";
  visibility: "private" | "public";
  created_at: string;
  updated_at: string;
};

export type Lesson = {
  id: string;
  input: LessonGenerationInput;
  output: LessonGenerationOutput;
};
