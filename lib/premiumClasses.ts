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
  | "bricepremiumcourses4"
  | "bricepremiumcourses5"
  | "bricepremiumcourses6"
  | "bricepremiumcourses7"
  | "bricepremiumcourses8"
  | "bricepremiumcourses9"
  | "bricepremiumcourses10"
  | "bricepremiumcourses11"
  | "bricepremiumcourses12"
  | "bricepremiumcourses13"
  | "bricepremiumcourses14"
  | "bricepremiumcourses15"
  | "bricepremiumcourses16"
  | "bricepremiumcourses17"
  | "bricepremiumcourses18"
  | "bricepremiumcourses19";

export type CourseStatus = "active" | "hidden" | "draft";

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
  status: CourseStatus;
  moduleCount: number;
  modules: PremiumModule[];
};

function getCourseRoot(slug: PremiumCourseSlug) {
  return path.join(PREMIUM_CLASSES_PRIVATE_ROOT, slug);
}

const COURSE_META: Record<
  PremiumCourseSlug,
  { title: string; subtitle: string; description: string; level: string; status: CourseStatus }
> = {
  bricepremiumcourses1: {
    title: "Business Management English",
    subtitle: "Premium Course 1",
    description:
      "Leadership, meetings, decision-making, and corporate communication modules for business managers and team leads.",
    level: "Professional",
    status: "active",
  },
  bricepremiumcourses2: {
    title: "Finance & Accounting English",
    subtitle: "Premium Course 2",
    description:
      "Financial statements, budgeting, reporting, compliance, and executive finance communication in professional English.",
    level: "Professional",
    status: "active",
  },
  bricepremiumcourses3: {
    title: "Marketing & Advertising English",
    subtitle: "Premium Course 3",
    description:
      "Core marketing language, campaign planning, customer research, and promotional strategy across twelve modules.",
    level: "Professional",
    status: "active",
  },
  bricepremiumcourses4: {
    title: "Legal & Compliance English",
    subtitle: "Premium Course 4",
    description:
      "Essential English for legal professionals: contracts, compliance, court terms, IP, governance, and regulatory communication across twelve modules.",
    level: "Professional",
    status: "active",
  },
  bricepremiumcourses5: {
    title: "Entrepreneurship & Startups English",
    subtitle: "Premium Course 5",
    description:
      "Business English for founders and startup professionals: pitching, funding, business models, MVP, market entry, and investor communication across thirteen modules.",
    level: "Professional",
    status: "active",
  },
  bricepremiumcourses6: {
    title: "Consulting & Strategy English",
    subtitle: "Premium Course 6",
    description:
      "Professional English for consultants: strategy frameworks, client communication, business case analysis, report writing, and delivering recommendations across twelve modules.",
    level: "Professional",
    status: "active",
  },
  bricepremiumcourses7: {
    title: "Operations & Manufacturing English",
    subtitle: "Premium Course 7",
    description:
      "Essential English for operations and manufacturing professionals: supply chain, logistics, quality control, process improvement, and factory floor communication across twelve modules.",
    level: "Professional",
    status: "active",
  },
  bricepremiumcourses8: {
    title: "Executive & Leadership English",
    subtitle: "Premium Course 8",
    description:
      "Advanced English for executives and senior leaders: boardroom communication, stakeholder management, crisis leadership, strategic vision, and executive presence across twelve modules.",
    level: "Professional",
    status: "active",
  },
  bricepremiumcourses9: {
    title: "Real Estate & Property Management English",
    subtitle: "Premium Course 9",
    description:
      "Professional English for real estate practitioners: property listings, client negotiations, lease agreements, market analysis, and property management communication across twelve modules.",
    level: "Professional",
    status: "active",
  },
  bricepremiumcourses10: {
    title: "Hospitality & Tourism English",
    subtitle: "Premium Course 10",
    description:
      "Essential English for hospitality and tourism professionals: guest services, hotel operations, travel industry vocabulary, customer relations, and event management across twelve modules.",
    level: "Professional",
    status: "active",
  },
  bricepremiumcourses11: {
    title: "Medical & Healthcare Business English",
    subtitle: "Premium Course 11",
    description:
      "Professional English for healthcare business contexts: medical administration, patient communication, clinical terminology, healthcare policy, and pharmaceutical industry language across twelve modules.",
    level: "Professional",
    status: "active",
  },
  bricepremiumcourses12: {
    title: "Human Resources (HR) English",
    subtitle: "Premium Course 12",
    description:
      "Comprehensive English for HR professionals: recruitment, talent management, performance reviews, employee relations, diversity and inclusion, and HR policy communication across twelve modules.",
    level: "Professional",
    status: "active",
  },
  // ── Reading Packs ── hidden until client approves upload
  bricepremiumcourses13: {
    title: "Reading Practice: A1 Level",
    subtitle: "Reading Course — Beginner",
    description:
      "Graded reading practice for A1 learners: short texts on personal life, home, school, and everyday situations with comprehension questions across four modules.",
    level: "A1 Beginner",
    status: "hidden",
  },
  bricepremiumcourses14: {
    title: "Reading Practice: A2 Level",
    subtitle: "Reading Course — Elementary",
    description:
      "Graded reading practice for A2 learners: texts on work, travel, daily life, and social situations with comprehension activities across four modules.",
    level: "A2 Elementary",
    status: "hidden",
  },
  bricepremiumcourses15: {
    title: "Reading Practice: B1 Level",
    subtitle: "Reading Course — Intermediate",
    description:
      "Graded reading practice for B1 learners: texts on business, society, technology, and travel with comprehension questions across four modules.",
    level: "B1 Intermediate",
    status: "hidden",
  },
  bricepremiumcourses16: {
    title: "Reading Practice: B2 Level",
    subtitle: "Reading Course — Upper Intermediate",
    description:
      "Graded reading practice for B2 learners: in-depth texts on global issues, business, environment, and psychology with comprehension activities across four modules.",
    level: "B2 Upper Intermediate",
    status: "hidden",
  },
  bricepremiumcourses17: {
    title: "Reading Practice: C1 Level",
    subtitle: "Reading Course — Advanced",
    description:
      "Advanced reading practice for C1 learners: challenging texts on society, business, ethics, technology, and psychology with detailed comprehension work across four modules.",
    level: "C1 Advanced",
    status: "hidden",
  },
  // ── Volumes ── hidden until client approves upload
  bricepremiumcourses18: {
    title: "Business English Speaking",
    subtitle: "Speaking Practice — All Levels",
    description:
      "Extensive speaking practice for business English learners: reading texts, discussion questions, and vocabulary exercises across five volumes covering a wide range of professional topics.",
    level: "B1–C1",
    status: "hidden",
  },
  bricepremiumcourses19: {
    title: "Sales & Customer Service English",
    subtitle: "Premium Course 19",
    description:
      "Professional English for sales and customer service: negotiation language, client communication, objection handling, product presentation, and CRM vocabulary across twelve modules.",
    level: "Professional",
    status: "active",
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

async function buildCourse(slug: PremiumCourseSlug): Promise<PremiumCourse> {
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
    status: COURSE_META[slug].status,
    moduleCount: sortedModules.length,
    modules: sortedModules,
  } satisfies PremiumCourse;
}

/** Returns ALL courses including hidden ones. Used internally and for admin tooling. */
export async function listPremiumCourses(): Promise<PremiumCourse[]> {
  const slugs = Object.keys(COURSE_META) as PremiumCourseSlug[];
  return Promise.all(slugs.map(buildCourse));
}

/**
 * Returns only active courses. Use this for any user-facing listing:
 * catalog, search, navigation, course counts, and static param generation.
 * Changing a course's status from "hidden" to "active" in COURSE_META is all
 * that's needed to publish it — no file imports or folder changes required.
 */
export async function listActivePremiumCourses(): Promise<PremiumCourse[]> {
  const courses = await listPremiumCourses();
  return courses.filter((c) => c.status === "active");
}

/**
 * Returns a course only if it is active. Hidden/draft courses resolve to null,
 * which causes pages to return 404 and the content route to return 404.
 */
export async function getPremiumCourse(courseSlug: string) {
  const courses = await listActivePremiumCourses();
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
