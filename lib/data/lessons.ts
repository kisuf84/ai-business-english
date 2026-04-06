import fs from "fs";
import path from "path";
import type {
  LessonGenerationInput,
  LessonGenerationOutput,
  LessonRecord,
} from "../../types/lesson";
import { getSupabaseAdminConfig, supabaseRest } from "../supabase/server";
import {
  validateLessonOutputPayload,
  validateLessonPayload,
} from "../validators/lesson";

const DATA_PATH = path.join(process.cwd(), ".data", "lessons.json");

type StoredLesson = LessonRecord;

function ensureDataFile() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, "[]", "utf-8");
  }
}

function readAll(): StoredLesson[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredLesson[]) : [];
  } catch {
    return [];
  }
}

function writeAll(lessons: StoredLesson[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(lessons, null, 2), "utf-8");
}

function isSupabaseEnabled() {
  return Boolean(getSupabaseAdminConfig());
}

export async function createLesson(params: {
  input: LessonGenerationInput;
  output: LessonGenerationOutput;
  user_id?: string | null;
}): Promise<LessonRecord> {
  const inputValidation = validateLessonPayload(params.input);
  if (!inputValidation.ok) {
    throw new Error(`invalid_lesson_input:${inputValidation.errors.join(";")}`);
  }

  const outputValidation = validateLessonOutputPayload(params.output);
  if (!outputValidation.ok) {
    throw new Error(`invalid_lesson_output:${outputValidation.errors.join(";")}`);
  }

  const now = new Date().toISOString();
  const lessonPayload: LessonRecord = {
    id: crypto.randomUUID(),
    user_id: params.user_id ?? null,
    title: params.output.title,
    topic: params.input.topic,
    level: params.input.level,
    industry: params.input.industry ?? null,
    profession: params.input.profession ?? null,
    lesson_type: params.input.lesson_type,
    source_url: params.input.source_url ?? null,
    content_json: params.output,
    status: "saved",
    visibility: "private",
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseEnabled()) {
    const [created] = await supabaseRest<LessonRecord[]>("lessons", {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        user_id: lessonPayload.user_id,
        title: lessonPayload.title,
        topic: lessonPayload.topic,
        level: lessonPayload.level,
        industry: lessonPayload.industry,
        profession: lessonPayload.profession,
        lesson_type: lessonPayload.lesson_type,
        source_url: lessonPayload.source_url,
        content_json: lessonPayload.content_json,
        status: lessonPayload.status,
        visibility: lessonPayload.visibility,
      }),
    });

    return created;
  }

  const lessons = readAll();
  lessons.unshift(lessonPayload);
  writeAll(lessons);
  return lessonPayload;
}

export async function listLessons(): Promise<LessonRecord[]> {
  if (isSupabaseEnabled()) {
    return supabaseRest<LessonRecord[]>(
      "lessons?select=*&order=created_at.desc"
    );
  }

  return readAll();
}

export async function getLessonById(id: string): Promise<LessonRecord | null> {
  if (isSupabaseEnabled()) {
    const results = await supabaseRest<LessonRecord[]>(
      `lessons?select=*&id=eq.${id}`
    );
    return results[0] ?? null;
  }

  const lessons = readAll();
  return lessons.find((lesson) => lesson.id === id) ?? null;
}

export async function deleteLesson(id: string): Promise<void> {
  if (isSupabaseEnabled()) {
    await supabaseRest(`lessons?id=eq.${id}`, {
      method: "DELETE",
    });
    return;
  }

  const lessons = readAll().filter((lesson) => lesson.id !== id);
  writeAll(lessons);
}

export async function archiveLesson(id: string): Promise<void> {
  const updated_at = new Date().toISOString();

  if (isSupabaseEnabled()) {
    await supabaseRest(`lessons?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "archived", updated_at }),
    });
    return;
  }

  const lessons: LessonRecord[] = readAll().map((lesson) =>
    lesson.id === id
      ? { ...lesson, status: "archived" as const, updated_at }
      : lesson
  );
  writeAll(lessons);
}

export async function duplicateLesson(id: string): Promise<LessonRecord | null> {
  const original = await getLessonById(id);
  if (!original) {
    return null;
  }

  const now = new Date().toISOString();
  const payload: Omit<LessonRecord, "id"> = {
    user_id: original.user_id,
    title: original.title,
    topic: original.topic,
    level: original.level,
    industry: original.industry,
    profession: original.profession,
    lesson_type: original.lesson_type,
    source_url: original.source_url,
    content_json: original.content_json,
    status: "saved",
    visibility: original.visibility,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseEnabled()) {
    const [created] = await supabaseRest<LessonRecord[]>("lessons", {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });
    return created;
  }

  const lesson: LessonRecord = {
    ...payload,
    id: crypto.randomUUID(),
  };
  const lessons = readAll();
  lessons.unshift(lesson);
  writeAll(lessons);
  return lesson;
}

export async function updateLessonVisibility(
  id: string,
  visibility: "private" | "public"
): Promise<void> {
  const updated_at = new Date().toISOString();

  if (isSupabaseEnabled()) {
    await supabaseRest(`lessons?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ visibility, updated_at }),
    });
    return;
  }

  const lessons = readAll().map((lesson) =>
    lesson.id === id ? { ...lesson, visibility, updated_at } : lesson
  );
  writeAll(lessons);
}
