import { NextResponse } from "next/server";
import { getRequestAuthUser } from "../../../lib/supabase/auth";
import { listLessons } from "../../../lib/data/lessons";
import { listActivePremiumCourses } from "../../../lib/premiumClasses";
import { listEnglishTrainingLessons } from "../../../lib/englishTraining";
import { TEACHER_RESOURCES } from "../../../lib/forTeachersResources";
import { ENGLISH_TRAINING_RELEASED } from "../../../lib/englishTrainingRelease";
import { listSituationalEnglishItems } from "../../../lib/situationalEnglish";
import { listListeningTrainingItems } from "../../../lib/listeningTraining";
import { listReadingTrainingItems } from "../../../lib/readingTraining";
import { listBilingualCompendiumItems } from "../../../lib/bilingualCompendium";
import { listLexiproItems } from "../../../lib/lexipro";
import { getLexicaItem } from "../../../lib/lexica";
import { getBizCompendiumItem } from "../../../lib/bizCompendium";
import { listGossipEnglishItems } from "../../../lib/gossipEnglish";

export type SearchResultType =
  | "lesson"
  | "premium-course"
  | "premium-module"
  | "english-training"
  | "for-teachers"
  | "situational-english"
  | "listening-training"
  | "reading-training"
  | "bilingual-compendium"
  | "lexipro"
  | "lexica"
  | "biz-compendium"
  | "gossip-english";

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

  // 4. August content-expansion libraries — same release gate as English
  // Training so nothing becomes searchable-but-unreachable if it's ever
  // flipped off.
  if (ENGLISH_TRAINING_RELEASED) {
    try {
      let situationalCount = 0;
      for (const item of listSituationalEnglishItems()) {
        if (situationalCount >= RESULTS_PER_SOURCE) break;
        if (matches(query, item.title)) {
          results.push({
            type: "situational-english",
            typeLabel: "Situational English",
            title: item.title,
            href: `/situational-english/${item.slug}`,
          });
          situationalCount += 1;
        }
      }
    } catch (error) {
      console.error("[search] situational_english_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }

    try {
      let listeningCount = 0;
      for (const item of listListeningTrainingItems()) {
        if (listeningCount >= RESULTS_PER_SOURCE) break;
        if (matches(query, item.title, item.level)) {
          results.push({
            type: "listening-training",
            typeLabel: "Listening Training",
            title: item.title,
            subtitle: item.level,
            href: `/listening-training/${item.slug}`,
          });
          listeningCount += 1;
        }
      }
    } catch (error) {
      console.error("[search] listening_training_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }

    try {
      let readingCount = 0;
      for (const item of listReadingTrainingItems()) {
        if (readingCount >= RESULTS_PER_SOURCE) break;
        if (matches(query, item.title, item.level)) {
          results.push({
            type: "reading-training",
            typeLabel: "Reading Training",
            title: item.title,
            subtitle: item.level,
            href: `/reading-training/${item.slug}`,
          });
          readingCount += 1;
        }
      }
    } catch (error) {
      console.error("[search] reading_training_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }

    try {
      let bilingualCount = 0;
      for (const item of listBilingualCompendiumItems()) {
        if (bilingualCount >= RESULTS_PER_SOURCE) break;
        if (matches(query, item.title, item.language)) {
          results.push({
            type: "bilingual-compendium",
            typeLabel: "Bilingual Compendium",
            title: item.title,
            subtitle: item.language,
            href: `/bilingual-compendium/${item.slug}`,
          });
          bilingualCount += 1;
        }
      }
    } catch (error) {
      console.error("[search] bilingual_compendium_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }

    try {
      let lexiproCount = 0;
      for (const item of listLexiproItems()) {
        if (lexiproCount >= RESULTS_PER_SOURCE) break;
        if (matches(query, item.title, item.language)) {
          results.push({
            type: "lexipro",
            typeLabel: "Lexipro",
            title: item.title,
            subtitle: item.language,
            href: `/lexipro/${item.slug}`,
          });
          lexiproCount += 1;
        }
      }
    } catch (error) {
      console.error("[search] lexipro_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }

    try {
      const lexica = getLexicaItem();
      if (matches(query, lexica.title, "Lexica")) {
        results.push({
          type: "lexica",
          typeLabel: "Lexica",
          title: lexica.title,
          href: "/lexica",
        });
      }
    } catch (error) {
      console.error("[search] lexica_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }

    try {
      const bizCompendium = getBizCompendiumItem();
      if (matches(query, bizCompendium.title, "Biz Compendium")) {
        results.push({
          type: "biz-compendium",
          typeLabel: "Biz Compendium",
          title: bizCompendium.title,
          href: "/biz-compendium",
        });
      }
    } catch (error) {
      console.error("[search] biz_compendium_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }

    try {
      let gossipCount = 0;
      for (const item of listGossipEnglishItems()) {
        if (gossipCount >= RESULTS_PER_SOURCE) break;
        if (matches(query, item.title, item.level, `Volume ${item.volume}`)) {
          results.push({
            type: "gossip-english",
            typeLabel: "Gossip English",
            title: item.title,
            subtitle: `${item.level} · Volume ${item.volume}`,
            href: `/gossip-english/${item.slug}`,
          });
          gossipCount += 1;
        }
      }
    } catch (error) {
      console.error("[search] gossip_english_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }

  // 5. For Teachers resources.
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
