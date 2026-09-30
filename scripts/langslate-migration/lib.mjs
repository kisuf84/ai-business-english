/**
 * Shared, deterministic helpers for the Sept 10 Langslate Corporate/Academy
 * migration tooling (manifest build, dry run, upload). Tooling only: nothing
 * in app/ or lib/ may import this file (it reads the local filesystem).
 *
 * Canonical layout (verified in the Phase 1 audit):
 *   LANGSLATE CORPORATE/{INDUSTRIES,DEPARTMENTS,LANGSLATE PRO,PROFESSIONS}/<category>/*.html
 *   LANGSLATE ACADEMY/{A0_40,A1_100,A2_100,B1_100,B2_100,C1_100} CLASSES/*.html
 * Everything else (PLATFORM runtime + duplicate copies, landing pages,
 * prototype ZIP, temp/backup files) is excluded with an explicit reason.
 */
import { createHash } from "crypto";
import { promises as fs, createReadStream } from "fs";
import path from "path";
import vm from "vm";

export const CONTENT_VERSION = "v1";

export const CORPORATE_ROOT = "LANGSLATE CORPORATE";
export const ACADEMY_ROOT = "LANGSLATE ACADEMY";

/** Source folder -> family slug + display label (order = Corporate IA order). */
export const CORPORATE_FAMILIES = [
  { folder: "INDUSTRIES", slug: "industries", label: "Industries", manifestSection: "industries" },
  { folder: "DEPARTMENTS", slug: "departments", label: "Departments", manifestSection: "departments" },
  { folder: "LANGSLATE PRO", slug: "pro", label: "Langslate Pro", manifestSection: "langslatePro" },
  { folder: "PROFESSIONS", slug: "professions", label: "Professions", manifestSection: "professions" },
];

export const ACADEMY_LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1"];
const ACADEMY_LEVEL_FOLDER = /^(A0|A1|A2|B1|B2|C1)_\d+ CLASSES$/;

/** Industries folders carry a " 60" batch suffix on 30 of 60 folders. */
const CATEGORY_BATCH_SUFFIX = / 60$/;

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isSafeContentKey(key) {
  return (
    /^[a-z0-9][a-z0-9/.-]*\.html$/.test(key) &&
    !key.split("/").some((seg) => seg === "" || seg === "." || seg === "..") &&
    !key.includes("//")
  );
}

// ---------------------------------------------------------------------------
// Titles / numbers

const NAMED_ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", mdash: "—", ndash: "–",
  middot: "·", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", eacute: "é",
  egrave: "è", agrave: "à", ccedil: "ç", ouml: "ö", uuml: "ü", auml: "ä", bull: "•",
  rarr: "→", larr: "←", times: "×", copy: "©", reg: "®", trade: "™", laquo: "«", raquo: "»",
};

export function decodeEntities(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named ?? match;
  });
}

function cleanText(value) {
  return decodeEntities(value).replace(/\s+/g, " ").trim();
}

/** Raw <title> text, entity-decoded. Titles sit in <head>, so read the first 256 KiB. */
export async function readHtmlTitle(absPath) {
  const handle = await fs.open(absPath, "r");
  try {
    const buf = Buffer.alloc(256 * 1024);
    const { bytesRead } = await handle.read(buf, 0, buf.length, 0);
    let head = buf.subarray(0, bytesRead).toString("utf8");
    let match = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!match) {
      head = await fs.readFile(absPath, "utf8");
      match = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    }
    return match ? cleanText(match[1]) : null;
  } finally {
    await handle.close();
  }
}

const TITLE_NUMBERED = /\b(?:module|lesson|unit)\s*0*(\d{1,3})\s*[:\-–—|]\s*(.+)$/i;
const ACADEMY_TITLE_PREFIX = /^(?:A0|A1|A2|B1|B2|C1)\s+English\s*(?:[—–:|]|-{1,2})\s*/i;
const ACADEMY_TITLE_LESSON = /^Lesson\s*\d{1,3}\s*[:\-–—]\s*/i;

/**
 * Display title from the lesson's own <title>. The HTML title is the richest
 * source (the prototype manifest often says only "Agribusiness — Module 4"),
 * but it carries template/brand prefixes, so keep only the lesson-specific
 * part. Falls back to the prototype manifest title.
 */
export function deriveDisplayTitle({ htmlTitle, manifestTitle, product }) {
  if (htmlTitle) {
    if (product === "academy") {
      const stripped = htmlTitle.replace(ACADEMY_TITLE_PREFIX, "").replace(ACADEMY_TITLE_LESSON, "").trim();
      if (stripped && stripped !== htmlTitle) return { title: stripped, titleSource: "html" };
    } else {
      const numbered = htmlTitle.match(TITLE_NUMBERED);
      if (numbered && numbered[2].trim()) return { title: numbered[2].trim(), titleSource: "html" };
    }
  }
  if (manifestTitle) return { title: cleanText(manifestTitle), titleSource: "prototype-manifest" };
  if (htmlTitle) return { title: htmlTitle, titleSource: "html-raw" };
  return { title: null, titleSource: null };
}

export function numberFromHtmlTitle(htmlTitle) {
  const match = htmlTitle?.match(TITLE_NUMBERED);
  return match ? Number(match[1]) : null;
}

/**
 * Lesson/module number from the Corporate filename. Filenames follow a
 * handful of client conventions (PILOT_MODULE_02_x, chemical-module3,
 * healthcare_module_10, AGRIBUSINESS 1, AGRICULTURE_10, sales_lesson4, ...);
 * only an explicit trailing module/lesson/space/underscore number counts.
 */
export function numberFromCorporateFilename(fileName) {
  const stem = fileName.replace(/\.html$/i, "");
  const explicit = stem.match(/(?:module|lesson)[\s_-]*0*(\d{1,3})(?:\D|$)/i);
  if (explicit) return Number(explicit[1]);
  const trailing = stem.match(/^[A-Za-z&\s-]+[\s_]0*(\d{1,3})$/);
  return trailing ? Number(trailing[1]) : null;
}

/** A0 filenames encode module + lesson: A0_M1_L05_Introducing_Yourself.html */
export function numberFromAcademyFilename(fileName) {
  const match = fileName.match(/^A0_M(\d+)_L0*(\d+)_/);
  return match ? { module: Number(match[1]), lesson: Number(match[2]) } : null;
}

// ---------------------------------------------------------------------------
// Prototype manifests (client-supplied PLATFORM/js/lessons.js) — used for
// category labels and ordering only; never for file discovery.

export async function loadPrototypeManifest(sourceRoot, productRoot) {
  const file = path.join(sourceRoot, productRoot, "PLATFORM", "js", "lessons.js");
  const code = `${await fs.readFile(file, "utf8")}\n;globalThis.__LESSONS__ = LESSONS;`;
  const context = {};
  vm.runInNewContext(code, context, { timeout: 5000 });
  return context.__LESSONS__;
}

// ---------------------------------------------------------------------------
// Source discovery + classification

async function walk(dir, base, out) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(abs, base, out);
    else if (entry.isFile()) out.push(path.relative(base, abs).split(path.sep).join("/"));
  }
  return out;
}

/**
 * Classifies every file under the Corporate + Academy product roots as
 * canonical or excluded (with reason). Returns relative POSIX paths only.
 */
export async function discoverSources(sourceRoot) {
  const accepted = [];
  const excluded = [];
  for (const productRoot of [CORPORATE_ROOT, ACADEMY_ROOT]) {
    const files = await walk(path.join(sourceRoot, productRoot), sourceRoot, []);
    for (const rel of files) {
      const parts = rel.split("/");
      const name = parts[parts.length - 1];
      const reason = exclusionReason(productRoot, parts, name);
      if (reason) excluded.push({ sourceRelativePath: rel, reason });
      else accepted.push(rel);
    }
  }
  return { accepted, excluded };
}

function exclusionReason(productRoot, parts, name) {
  if (name === ".DS_Store") return "os-metadata";
  if (name.startsWith(".")) return "hidden-temp-or-backup";
  if (parts[1] === "PLATFORM") return "prototype-platform-runtime-or-duplicate";
  if (parts[1] === "_PLATFORM PROTOTYPE") return "prototype-zip";
  if (!/\.html$/i.test(name)) return "non-lesson-asset";
  if (productRoot === CORPORATE_ROOT) {
    if (parts.length === 2) return "landing-or-loose-file";
    const family = CORPORATE_FAMILIES.find((f) => f.folder === parts[1]);
    if (!family) return "unknown-corporate-folder";
    if (parts.length !== 4) return "unexpected-depth";
    return null;
  }
  if (parts.length === 2) return "landing-or-loose-file";
  if (!ACADEMY_LEVEL_FOLDER.test(parts[1])) return "unknown-academy-folder";
  if (parts.length !== 3) return "unexpected-depth";
  return null;
}

/** Deterministic record identity for one canonical source path. */
export function classifyCanonical(rel) {
  const parts = rel.split("/");
  const fileName = parts[parts.length - 1];
  const lessonSlug = slugify(fileName.replace(/\.html$/i, ""));
  if (parts[0] === CORPORATE_ROOT) {
    const family = CORPORATE_FAMILIES.find((f) => f.folder === parts[1]);
    const categoryFolder = parts[2];
    const categorySlug = slugify(categoryFolder.replace(CATEGORY_BATCH_SUFFIX, ""));
    return {
      product: "corporate",
      family: family.slug,
      categoryFolder,
      categorySlug,
      fileName,
      slug: lessonSlug,
      contentKey: `corporate/${family.slug}/${categorySlug}/${lessonSlug}.html`,
    };
  }
  const level = parts[1].match(ACADEMY_LEVEL_FOLDER)[1];
  return {
    product: "academy",
    level,
    fileName,
    slug: lessonSlug,
    contentKey: `academy/${level.toLowerCase()}/${lessonSlug}.html`,
  };
}

export function objectKeyFor(contentKey) {
  return `${CONTENT_VERSION}/${contentKey}`;
}

// ---------------------------------------------------------------------------

export function sha256OfBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function sha256OfFile(absPath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(absPath)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", () => resolve(hash.digest("hex")));
  });
}

export function requireSourceRoot() {
  const root = process.env.LANGSLATE_SEPT10_SOURCE;
  if (!root) {
    console.error(
      "Set LANGSLATE_SEPT10_SOURCE to the Sept 10 migration folder (the directory containing 'LANGSLATE CORPORATE' and 'LANGSLATE ACADEMY')."
    );
    process.exit(2);
  }
  return path.resolve(root);
}

export function requireStagingDir() {
  const dir = process.env.LANGSLATE_MIGRATION_STAGING;
  if (!dir) {
    console.error(
      "Set LANGSLATE_MIGRATION_STAGING to a scratch directory OUTSIDE the repo and OUTSIDE the source folder (manifest, transformed upload copies and reports are written there)."
    );
    process.exit(2);
  }
  return path.resolve(dir);
}

/** Refuse to write inside the immutable source tree or inside the repo. */
export function assertSafeStaging(stagingDir, sourceRoot, repoRoot) {
  const inside = (child, parent) => {
    const rel = path.relative(parent, child);
    return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
  };
  if (inside(stagingDir, sourceRoot)) throw new Error("Staging dir must not be inside the Sept 10 source folder.");
  if (inside(stagingDir, repoRoot)) throw new Error("Staging dir must not be inside the app repo.");
}
