import { promises as fs } from "fs";
import path from "path";

const PREMIUM_CLASSES_ROOT = path.join(process.cwd(), "public", "premium-classes");

export type PremiumCourseSlug =
  | "bricepremiumcourses1"
  | "bricepremiumcourses2"
  | "bricepremiumcourses3";

export type PremiumModule = {
  slug: string;
  title: string;
  number: number;
  iframeSrc: string;
};

export type PremiumCourse = {
  slug: PremiumCourseSlug;
  title: string;
  subtitle: string;
  description: string;
  moduleCount: number;
  modules: PremiumModule[];
};

const COURSE_META: Record<
  PremiumCourseSlug,
  { title: string; subtitle: string; description: string }
> = {
  bricepremiumcourses1: {
    title: "Business Management English",
    subtitle: "Premium Course 1",
    description:
      "Leadership, meetings, decision-making, and corporate communication modules for business managers and team leads.",
  },
  bricepremiumcourses2: {
    title: "Finance & Accounting English",
    subtitle: "Premium Course 2",
    description:
      "Financial statements, budgeting, reporting, compliance, and executive finance communication in professional English.",
  },
  bricepremiumcourses3: {
    title: "Marketing & Advertising English",
    subtitle: "Premium Course 3",
    description:
      "Core marketing language, campaign planning, customer research, and promotional strategy across twelve modules.",
  },
};

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&middot;/g, "·")
    .trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeModuleTitle(value: string, courseTitle: string, number: number) {
  const decoded = decodeHtmlEntities(value);
  const normalizedSpaces = decoded.replace(/\s+/g, " ").trim();
  const canonicalPrefix = `Module ${number}:`;

  const prefixedPattern = new RegExp(
    `^Module\\s+${number}\\s*[:\\-—–·]\\s*(.+?)(?:\\s*[—–-]\\s*.+)?$`,
    "i"
  );
  const prefixedMatch = normalizedSpaces.match(prefixedPattern);
  if (prefixedMatch) {
    const cleanPart = prefixedMatch[1]?.trim();
    return cleanPart ? `${canonicalPrefix} ${cleanPart}` : `Module ${number}`;
  }

  const coursePrefixPattern = new RegExp(
    `^${escapeRegex(courseTitle)}\\s*[—–-]\\s*Module\\s+${number}(?::\\s*(.*))?$`,
    "i"
  );
  const coursePrefixMatch = normalizedSpaces.match(coursePrefixPattern);
  if (coursePrefixMatch) {
    const cleanPart = (coursePrefixMatch[1] || "").trim();
    return cleanPart ? `${canonicalPrefix} ${cleanPart}` : `Module ${number}`;
  }

  const anyModulePattern = new RegExp(
    `\\bModule\\s+${number}\\b(?:\\s*[:\\-—–·]\\s*(.+?))?(?:\\s*[—–-]\\s*.+)?$`,
    "i"
  );
  const anyModuleMatch = normalizedSpaces.match(anyModulePattern);
  if (anyModuleMatch) {
    const cleanPart = (anyModuleMatch[1] || "").trim();
    return cleanPart ? `${canonicalPrefix} ${cleanPart}` : `Module ${number}`;
  }

  return `Module ${number}`;
}

function formatModuleFallback(_courseTitle: string, number: number) {
  return `Module ${number}`;
}

async function readModuleTitle(filePath: string, courseTitle: string, number: number) {
  try {
    const html = await fs.readFile(filePath, "utf-8");
    const match = html.match(/<title>(.*?)<\/title>/i);
    if (!match) {
      return formatModuleFallback(courseTitle, number);
    }
    return normalizeModuleTitle(match[1], courseTitle, number);
  } catch {
    return formatModuleFallback(courseTitle, number);
  }
}

export async function listPremiumCourses(): Promise<PremiumCourse[]> {
  const slugs = Object.keys(COURSE_META) as PremiumCourseSlug[];

  return Promise.all(
    slugs.map(async (slug) => {
      const directory = path.join(PREMIUM_CLASSES_ROOT, slug);
      const entries = await fs.readdir(directory);
      const modules = await Promise.all(
        entries
          .filter((entry) => /^module_\d+\.html$/i.test(entry))
          .map(async (entry) => {
            const numberMatch = entry.match(/^module_(\d+)\.html$/i);
            const number = numberMatch ? Number(numberMatch[1]) : 0;
            const moduleSlug = entry.replace(/\.html$/i, "");
            const courseTitle = COURSE_META[slug].title;

            return {
              slug: moduleSlug,
              title: await readModuleTitle(path.join(directory, entry), courseTitle, number),
              number,
              iframeSrc: `/premium-classes/${slug}/${entry}`,
            } satisfies PremiumModule;
          })
      );

      const sortedModules = modules.sort((a, b) => a.number - b.number);

      return {
        slug,
        title: COURSE_META[slug].title,
        subtitle: COURSE_META[slug].subtitle,
        description: COURSE_META[slug].description,
        moduleCount: sortedModules.length,
        modules: sortedModules,
      } satisfies PremiumCourse;
    })
  );
}

export async function getPremiumCourse(courseSlug: string) {
  const courses = await listPremiumCourses();
  return courses.find((course) => course.slug === courseSlug) ?? null;
}

export async function getPremiumModule(courseSlug: string, moduleSlug: string) {
  const course = await getPremiumCourse(courseSlug);
  if (!course) return null;

  const module = course.modules.find((item) => item.slug === moduleSlug) ?? null;
  if (!module) return null;

  return {
    course,
    module,
    currentIndex: course.modules.findIndex((item) => item.slug === moduleSlug),
  };
}
