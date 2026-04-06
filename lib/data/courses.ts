import fs from "fs";
import path from "path";
import type {
  CourseGenerationInput,
  CourseGenerationOutput,
  CourseRecord,
} from "../../types/course";
import { getSupabaseAdminConfig, supabaseRest } from "../supabase/server";

const DATA_PATH = path.join(process.cwd(), ".data", "courses.json");

type StoredCourse = CourseRecord;

function ensureDataFile() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, "[]", "utf-8");
  }
}

function readAll(): StoredCourse[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredCourse[]) : [];
  } catch {
    return [];
  }
}

function writeAll(courses: StoredCourse[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(courses, null, 2), "utf-8");
}

function isSupabaseEnabled() {
  return Boolean(getSupabaseAdminConfig());
}

export async function createCourse(params: {
  input: CourseGenerationInput;
  output: CourseGenerationOutput;
  user_id?: string | null;
}): Promise<CourseRecord> {
  const now = new Date().toISOString();
  const coursePayload: CourseRecord = {
    id: crypto.randomUUID(),
    user_id: params.user_id ?? null,
    title: params.output.course_title,
    topic: params.input.topic,
    level: params.input.level,
    industry: params.input.industry ?? null,
    profession: params.input.profession ?? null,
    summary: params.output.summary,
    outline_json: params.output,
    created_at: now,
  };

  if (isSupabaseEnabled()) {
    const [created] = await supabaseRest<CourseRecord[]>("courses", {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        user_id: coursePayload.user_id,
        title: coursePayload.title,
        topic: coursePayload.topic,
        level: coursePayload.level,
        industry: coursePayload.industry,
        profession: coursePayload.profession,
        summary: coursePayload.summary,
        outline_json: coursePayload.outline_json,
      }),
    });

    return created;
  }

  const courses = readAll();
  courses.unshift(coursePayload);
  writeAll(courses);
  return coursePayload;
}

export async function listCourses(): Promise<CourseRecord[]> {
  if (isSupabaseEnabled()) {
    return supabaseRest<CourseRecord[]>(
      "courses?select=*&order=created_at.desc"
    );
  }

  return readAll();
}

export async function getCourseById(id: string): Promise<CourseRecord | null> {
  if (isSupabaseEnabled()) {
    const results = await supabaseRest<CourseRecord[]>(
      `courses?select=*&id=eq.${id}`
    );
    return results[0] ?? null;
  }

  const courses = readAll();
  return courses.find((course) => course.id === id) ?? null;
}
