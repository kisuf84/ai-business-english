import { promises as fs } from "fs";
import path from "path";

const PREMIUM_CLASSES_PRIVATE_ROOT = path.join(
  process.cwd(),
  "premium-content",
  "premium-classes"
);

export type PremiumCourseSlug =
  | "bricepremiumcourses1"
  | "bricepremiumcourses2"
  | "bricepremiumcourses3"
  | "executive-leadership-english"
  | "consulting-strategy-english"
  | "operations-manufacturing-english"
  | "entrepreneurship-startups-english";

export type PremiumModule = {
  slug: string;
  title: string;
  number: number;
  iframeSrc: string;
  isPreview: boolean;
  isLocked: boolean;
};

export type PremiumCourse = {
  slug: PremiumCourseSlug;
  title: string;
  subtitle: string;
  description: string;
  level: string;
  moduleCount: number;
  modules: PremiumModule[];
};

function getCourseRoot(slug: PremiumCourseSlug) {
  return path.join(PREMIUM_CLASSES_PRIVATE_ROOT, slug);
}

const COURSE_META: Record<
  PremiumCourseSlug,
  { title: string; subtitle: string; description: string; level: string }
> = {
  bricepremiumcourses1: {
    title: "Business Management English",
    subtitle: "Premium Course 1",
    description:
      "Leadership, meetings, decision-making, and corporate communication modules for business managers and team leads.",
    level: "Professional",
  },
  bricepremiumcourses2: {
    title: "Finance & Accounting English",
    subtitle: "Premium Course 2",
    description:
      "Financial statements, budgeting, reporting, compliance, and executive finance communication in professional English.",
    level: "Professional",
  },
  bricepremiumcourses3: {
    title: "Marketing & Advertising English",
    subtitle: "Premium Course 3",
    description:
      "Core marketing language, campaign planning, customer research, and promotional strategy across twelve modules.",
    level: "Professional",
  },
  "executive-leadership-english": {
    title: "Executive & Leadership English",
    subtitle: "Sanitized Pilot Course",
    description:
      "Business English for leadership, executive communication, strategy, decision-making, and high-level professional contexts.",
    level: "B2-C1",
  },
  "consulting-strategy-english": {
    title: "Consulting & Strategy English",
    subtitle: "Sanitized Review Course",
    description:
      "Business English for consulting, strategic analysis, client communication, recommendations, and professional advisory work.",
    level: "B2-C1",
  },
  "operations-manufacturing-english": {
    title: "Operations & Manufacturing English",
    subtitle: "Sanitized Review Course",
    description:
      "Business English for operations, manufacturing, process improvement, supply chains, production reporting, and workplace communication.",
    level: "B2-C1",
  },
  "entrepreneurship-startups-english": {
    title: "Entrepreneurship & Startups English",
    subtitle: "Sanitized Review Course",
    description:
      "Business English for startups, investor communication, business models, pitching, partnerships, and entrepreneurial decision-making.",
    level: "B2-C1",
  },
};

const FULLY_UNLOCKED_REVIEW_COURSES = new Set<PremiumCourseSlug>([
  "executive-leadership-english",
  "consulting-strategy-english",
  "operations-manufacturing-english",
  "entrepreneurship-startups-english",
]);

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

  const stripTrailingCourseName = (candidate: string) => {
    const trailingCoursePattern = new RegExp(
      `\\s*[—–-]\\s*${escapeRegex(courseTitle)}\\s*$`,
      "i"
    );
    return candidate.replace(trailingCoursePattern, "").trim();
  };

  const prefixedPattern = new RegExp(`^Module\\s+${number}\\s*[:\\-—–·]\\s*(.+)$`, "i");
  const prefixedMatch = normalizedSpaces.match(prefixedPattern);
  if (prefixedMatch) {
    const cleanPart = stripTrailingCourseName(prefixedMatch[1]?.trim() || "");
    return cleanPart ? `${canonicalPrefix} ${cleanPart}` : `Module ${number}`;
  }

  const coursePrefixPattern = new RegExp(
    `^${escapeRegex(courseTitle)}\\s*[—–-]\\s*Module\\s+${number}(?::\\s*(.*))?$`,
    "i"
  );
  const coursePrefixMatch = normalizedSpaces.match(coursePrefixPattern);
  if (coursePrefixMatch) {
    const cleanPart = stripTrailingCourseName((coursePrefixMatch[1] || "").trim());
    return cleanPart ? `${canonicalPrefix} ${cleanPart}` : `Module ${number}`;
  }

  const anyModulePattern = new RegExp(`\\bModule\\s+${number}\\b(?:\\s*[:\\-—–·]\\s*(.+))?$`, "i");
  const anyModuleMatch = normalizedSpaces.match(anyModulePattern);
  if (anyModuleMatch) {
    const cleanPart = stripTrailingCourseName((anyModuleMatch[1] || "").trim());
    return cleanPart ? `${canonicalPrefix} ${cleanPart}` : `Module ${number}`;
  }

  return `Module ${number}`;
}

function formatModuleFallback(_courseTitle: string, number: number) {
  return `Module ${number}`;
}

function isPreviewModule(number: number) {
  return number === 1;
}

function isModuleLocked(_courseSlug: PremiumCourseSlug, _number: number) {
  return false;
}

async function readModuleTitle(filePath: string, courseTitle: string, number: number) {
  try {
    const html = await fs.readFile(filePath, "utf-8");
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const fromTitle = titleMatch
      ? normalizeModuleTitle(titleMatch[1], courseTitle, number)
      : formatModuleFallback(courseTitle, number);
    if (fromTitle !== `Module ${number}`) {
      return fromTitle;
    }

    const headingMatches = Array.from(
      html.matchAll(/<(h1|h2)[^>]*>(.*?)<\/\1>/gi)
    ).map((match) =>
      decodeHtmlEntities(
        match[2]
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      )
    );

    for (const heading of headingMatches) {
      if (!heading) continue;
      const normalizedHeading = normalizeModuleTitle(heading, courseTitle, number);
      if (normalizedHeading !== `Module ${number}`) {
        return normalizedHeading;
      }

      const cleanHeading = heading.replace(/\s+/g, " ").trim();
      if (
        cleanHeading &&
        !new RegExp(`^Module\\s+${number}$`, "i").test(cleanHeading) &&
        !new RegExp(`^${escapeRegex(courseTitle)}$`, "i").test(cleanHeading) &&
        cleanHeading.length > 4
      ) {
        return `Module ${number}: ${cleanHeading}`;
      }
    }

    return formatModuleFallback(courseTitle, number);
  } catch {
    return formatModuleFallback(courseTitle, number);
  }
}

export async function listPremiumCourses(): Promise<PremiumCourse[]> {
  const slugs = Object.keys(COURSE_META) as PremiumCourseSlug[];

  return Promise.all(
    slugs.map(async (slug) => {
      const directory = getCourseRoot(slug);
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
              iframeSrc: `/premium-content/${slug}/${moduleSlug}`,
              isPreview: isPreviewModule(number),
              isLocked: isModuleLocked(slug, number),
            } satisfies PremiumModule;
          })
      );

      const sortedModules = modules.sort((a, b) => a.number - b.number);

      return {
        slug,
        title: COURSE_META[slug].title,
        subtitle: COURSE_META[slug].subtitle,
        description: COURSE_META[slug].description,
        level: COURSE_META[slug].level,
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

export async function getPremiumModuleFilePath(
  courseSlug: string,
  moduleSlug: string
) {
  const entry = await getPremiumModule(courseSlug, moduleSlug);
  if (!entry) {
    return null;
  }

  const filePath = path.join(
    PREMIUM_CLASSES_PRIVATE_ROOT,
    entry.course.slug,
    `${entry.module.slug}.html`
  );

  return {
    ...entry,
    filePath,
  };
}
