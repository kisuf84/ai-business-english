import { NextResponse } from "next/server";
import { getRequestAuthUser } from "../../../lib/supabase/auth";
import { listLessons } from "../../../lib/data/lessons";
import { listActivePremiumCourses } from "../../../lib/premiumClasses";
import { listEnglishTrainingLessons } from "../../../lib/englishTraining";
import { TEACHER_RESOURCES } from "../../../lib/forTeachersResources";
import { ENGLISH_TRAINING_RELEASED } from "../../../lib/englishTrainingRelease";

export type SearchResultType =
  | "lesson"
  | "premium-course"
  | "premium-module"
  | "english-training"
  | "for-teachers";

export type SearchResult = {
  type: SearchResultType;
  typeLabel: string;
  title: string;
  subtitle?: string;
  href: string;
};

const RESULTS_PER_SOURCE = 6;

function matches(query: string, ...fields: Array<string | null | undefined>) {
  return fields.some((field) => field && field.toLowerCase().includes(query));
}

export async function GET(request: Request) {
  const authUser = await getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawQuery = url.searchParams.get("q") ?? "";
  const query = rawQuery.trim().toLowerCase();

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const results: SearchResult[] = [];

  // 1. The current user's own generated lessons — strictly scoped to authUser.id,
  // never another user's lessons.
  try {
    const lessons = await listLessons(authUser.id);
    for (const lesson of lessons) {
      if (results.filter((r) => r.type === "lesson").length >= RESULTS_PER_SOURCE) break;
      if (matches(query, lesson.title, lesson.topic, lesson.lesson_type, lesson.industry, lesson.profession)) {
        results.push({
          type: "lesson",
          typeLabel: "Your Lessons",
          title: lesson.title,
          subtitle: [lesson.level, lesson.lesson_type].filter(Boolean).join(" · ") || undefined,
          href: `/lessons/${lesson.id}`,
        });
      }
    }
  } catch (error) {
    console.error("[search] user_lessons_failed", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }

  // 2. Premium Courses — course-level and module-level matches.
  try {
    const courses = await listActivePremiumCourses();
    let premiumCount = 0;
    for (const course of courses) {
      if (premiumCount >= RESULTS_PER_SOURCE) break;
      if (matches(query, course.title, course.subtitle, course.description, course.level)) {
        results.push({
          type: "premium-course",
          typeLabel: "Premium Courses",
          title: course.title,
          subtitle: course.subtitle,
          href: `/premium-classes/${course.slug}`,
        });
        premiumCount += 1;
      }

      for (const module of course.modules) {
        if (premiumCount >= RESULTS_PER_SOURCE) break;
        if (module.isLocked) continue;
        if (matches(query, module.title)) {
          results.push({
            type: "premium-module",
            typeLabel: "Premium Courses",
            title: module.title,
            subtitle: course.title,
            href: `/premium-classes/${course.slug}/${module.slug}`,
          });
          premiumCount += 1;
        }
      }
    }
  } catch (error) {
    console.error("[search] premium_courses_failed", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }

  // 3. English Training — excluded from search entirely while the section is
  // unreleased (ENGLISH_TRAINING_RELEASED === false); routes stay live for
  // direct-URL QA regardless.
  if (ENGLISH_TRAINING_RELEASED) {
    try {
      const lessons = listEnglishTrainingLessons();
      let englishTrainingCount = 0;
      for (const lesson of lessons) {
        if (englishTrainingCount >= RESULTS_PER_SOURCE) break;
        if (matches(query, lesson.title, lesson.category)) {
          results.push({
            type: "english-training",
            typeLabel: "English Training",
            title: lesson.title,
            subtitle: lesson.category,
            href: `/english-training/${lesson.slug}`,
          });
          englishTrainingCount += 1;
        }
      }
    } catch (error) {
      console.error("[search] english_training_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }

  // 4. For Teachers resources.
  let teacherCount = 0;
  for (const resource of TEACHER_RESOURCES) {
    if (teacherCount >= RESULTS_PER_SOURCE) break;
    if (matches(query, resource.title)) {
      results.push({
        type: "for-teachers",
        typeLabel: "For Teachers",
        title: resource.title,
        href: `/for-teachers/${resource.id}`,
      });
      teacherCount += 1;
    }
  }

  return NextResponse.json({ results });
}
