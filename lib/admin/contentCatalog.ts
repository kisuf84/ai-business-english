import "server-only";

import { listAcademyLevels } from "../langslateAcademy";
import {
  corporateLessonHref,
  listCorporateFamilies,
} from "../langslateCorporate";
import { listEnglishTrainingLessons } from "../englishTraining";
import { listListeningTrainingItems } from "../listeningTraining";
import { listReadingTrainingItems } from "../readingTraining";
import { listSituationalEnglishItems } from "../situationalEnglish";
import { listBilingualCompendiumItems } from "../bilingualCompendium";
import { listLexiproItems } from "../lexipro";
import { getLexicaItem } from "../lexica";
import { getBizCompendiumItem } from "../bizCompendium";
import { listGossipEnglishItems } from "../gossipEnglish";
import { listBusinessIndustriesItems } from "../businessIndustries";
import {
  listSyntaxFlowItems,
  SYNTAX_FLOW_LANGUAGES,
} from "../syntaxFlow";
import { getLevelTestItem } from "../levelTest";
import { getListeningHubItem } from "../listeningHub";
import { getSpeakingTopicsItem } from "../speakingTopics";
import { listLangslate365Items } from "../langslate365";
import { listLangslateFlowItems } from "../langslateFlow";
import { listPremiumCourses } from "../premiumClasses";

export type AdminContentSource =
  | "corporate"
  | "academy"
  | "premium"
  | "library";

export type AdminContentItem = {
  id: string;
  source: AdminContentSource;
  platform: string;
  category: string;
  title: string;
  slug: string;
  contentReference: string;
  previewHref: string | null;
  healthHref: string | null;
  availability: "catalogued" | "local";
  publishing: "active" | "hidden" | "draft" | "not-modelled";
};

function libraryItem(
  platform: string,
  category: string,
  item: { slug: string; title: string; sourceFile: string },
  previewHref: string,
  healthHref = previewHref
): AdminContentItem {
  return {
    id: `library:${platform}:${item.slug}`,
    source: "library",
    platform,
    category,
    title: item.title,
    slug: item.slug,
    contentReference: item.sourceFile,
    previewHref,
    healthHref,
    availability: "local",
    publishing: "not-modelled",
  };
}

export async function listAdminContentCatalog(): Promise<AdminContentItem[]> {
  const items: AdminContentItem[] = [];

  for (const family of listCorporateFamilies()) {
    for (const category of family.categories) {
      for (const lesson of category.lessons) {
        items.push({
          id: `corporate:${lesson.contentKey}`,
          source: "corporate",
          platform: "Corporate",
          category: `${family.label} / ${category.label}`,
          title: lesson.title,
          slug: lesson.slug,
          contentReference: lesson.contentKey,
          previewHref: corporateLessonHref(family.slug, category.slug, lesson.slug),
          healthHref: null,
          availability: "catalogued",
          publishing: "not-modelled",
        });
      }
    }
  }

  let academyLessonId = 1;
  for (const level of listAcademyLevels()) {
    for (const lesson of level.lessons) {
      items.push({
        id: `academy:${lesson.contentKey}`,
        source: "academy",
        platform: "Academy",
        category: level.label,
        title: lesson.title,
        slug: lesson.slug,
        contentReference: lesson.contentKey,
        previewHref: `/apps/academy/platform#lesson/${academyLessonId}`,
        healthHref: null,
        availability: "catalogued",
        publishing: "not-modelled",
      });
      academyLessonId += 1;
    }
  }

  const addLibrary = (
    platform: string,
    category: string,
    values: Array<{ slug: string; title: string; sourceFile: string }>,
    href: (slug: string) => string
  ) => values.forEach((item) => items.push(libraryItem(platform, category, item, href(item.slug))));

  listEnglishTrainingLessons().forEach((item) => items.push(libraryItem("English Training", "Lesson", item, `/english-training/${item.slug}`, `/english-training-content/${item.slug}`)));
  listListeningTrainingItems().forEach((item) => items.push(libraryItem("Listening Training", "Lesson", item, `/listening-training/${item.slug}`, `/content/listening-training/${item.slug}`)));
  listReadingTrainingItems().forEach((item) => items.push(libraryItem("Reading Training", "Lesson", item, `/reading-training/${item.slug}`, `/content/reading-training/${item.slug}`)));
  listSituationalEnglishItems().forEach((item) => items.push(libraryItem("Situational English", "Lesson", item, `/situational-english/${item.slug}`, `/content/situational-english/${item.slug}`)));
  addLibrary("Bilingual Compendium", "Language", listBilingualCompendiumItems(), (slug) => `/bilingual-compendium/${slug}`);
  addLibrary("Lexipro", "Language", listLexiproItems(), (slug) => `/lexipro/${slug}`);
  addLibrary("Gossip English", "Lesson", listGossipEnglishItems(), (slug) => `/gossip-english/${slug}`);
  addLibrary("Business Industries", "Industry", listBusinessIndustriesItems(), (slug) => `/business-industries/${slug}`);

  for (const language of SYNTAX_FLOW_LANGUAGES) {
    addLibrary(
      "SyntaxFlow",
      language.label,
      listSyntaxFlowItems(language.slug),
      () => `/syntax-flow/${language.slug}`
    );
  }

  const lexica = getLexicaItem();
  items.push(libraryItem("Lexica", "Reference", lexica, "/lexica"));
  const biz = getBizCompendiumItem();
  items.push(libraryItem("Biz Compendium", "Reference", biz, "/biz-compendium"));
  const levelTest = getLevelTestItem();
  items.push(libraryItem("Level Test", "Assessment", levelTest, "/level-test"));
  const listeningHub = getListeningHubItem();
  items.push(libraryItem("Listening Hub", "Reference", listeningHub, "/listening-hub"));
  const speakingTopics = getSpeakingTopicsItem();
  items.push(libraryItem("Speaking Topics", "Reference", speakingTopics, "/speaking-topics"));

  addLibrary("Langslate 365", "Experience", listLangslate365Items(), (slug) =>
    slug === "course" ? "/apps/365/course" : "/apps/365"
  );
  addLibrary("Langslate Flow", "Experience", listLangslateFlowItems(), (slug) =>
    slug === "app" ? "/apps/flow/practice" : "/apps/flow"
  );

  const premiumCourses = await listPremiumCourses();
  for (const course of premiumCourses) {
    for (const module of course.modules) {
      items.push({
        id: `premium:${course.slug}:${module.slug}`,
        source: "premium",
        platform: "Premium Classes",
        category: course.title,
        title: module.title,
        slug: module.slug,
        contentReference: module.iframeSrc,
        previewHref: `/premium-classes/${course.slug}/${module.slug}`,
        healthHref: module.iframeSrc,
        availability: "local",
        publishing: course.status,
      });
    }
  }

  return items;
}

export async function getAdminCatalogSummary() {
  const items = await listAdminContentCatalog();
  const platforms = new Set(items.map((item) => item.platform));
  const categories = new Set(items.map((item) => `${item.platform}:${item.category}`));

  return {
    itemCount: items.length,
    platformCount: platforms.size,
    categoryCount: categories.size,
    sourceCounts: {
      corporate: items.filter((item) => item.source === "corporate").length,
      academy: items.filter((item) => item.source === "academy").length,
      premium: items.filter((item) => item.source === "premium").length,
      library: items.filter((item) => item.source === "library").length,
    },
  };
}
