/**
 * Copies original source HTML files into premium-content/ with a single change:
 * the direct Anthropic API fetch URL is replaced with our server-side proxy endpoint.
 *
 * No pre-rendering. No script stripping. No HTML modification beyond the URL swap.
 * The result is functionally identical to opening the original file in a browser.
 *
 * Usage:
 *   node scripts/injectInteractiveScripts.mjs                      # all courses
 *   node scripts/injectInteractiveScripts.mjs bricepremiumcourses8 # one course
 *   node scripts/injectInteractiveScripts.mjs bricepremiumcourses8 1  # one module
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const CONTENT_ROOT = resolve(PROJECT_ROOT, "premium-content/premium-classes");
const SOURCE_ROOT =
  "/Users/IssoufK/Documents/Projects/ai-business-english-Premium courses html";

// HR (courses12): 1-5,7,8 → HR_MODULE_{i}.html; 6,9-12 → HR_MODULE {i}.html
function hrFilename(i) {
  const spaceNums = new Set([6, 9, 10, 11, 12]);
  return spaceNums.has(i) ? `HR_MODULE ${i}.html` : `HR_MODULE_${i}.html`;
}

// Sales (courses19): 1-4,6,8 → MODULE {i}.html; 5,7,9-12 → MODULE_{i}.html
function salesFilename(i) {
  const spaceNums = new Set([1, 2, 3, 4, 6, 8]);
  return spaceNums.has(i) ? `MODULE ${i}.html` : `MODULE_${i}.html`;
}

const COURSE_MAP = [
  {
    course: "bricepremiumcourses4",
    sourceDir: `${SOURCE_ROOT}/brice_premiummodules6`,
    filename: (i) => `LEGAL_MODULE ${i}.html`,
    count: 12,
  },
  {
    course: "bricepremiumcourses5",
    sourceDir: `${SOURCE_ROOT}/brice_premiummodules7`,
    filename: (i) => `ENT_MODULE ${i}.html`,
    count: 13,
  },
  {
    course: "bricepremiumcourses6",
    sourceDir: `${SOURCE_ROOT}/brice_premiummodules8`,
    filename: (i) => `CS_MODULE ${i}.html`,
    count: 12,
  },
  {
    course: "bricepremiumcourses7",
    sourceDir: `${SOURCE_ROOT}/brice_premiummodules9`,
    // module 10 uses a dash instead of underscore
    filename: (i) => (i === 10 ? `OM-MODULE 10.html` : `OM_MODULE ${i}.html`),
    count: 12,
  },
  {
    course: "bricepremiumcourses8",
    sourceDir: `${SOURCE_ROOT}/brice_premiummodules10`,
    filename: (i) => `EL_MODULE ${i}.html`,
    count: 12,
  },
  {
    course: "bricepremiumcourses9",
    sourceDir: `${SOURCE_ROOT}/brice_premiummodules11`,
    // module 1 uses a dash instead of underscore
    filename: (i) => (i === 1 ? `REAL-MODULE 1.html` : `REAL_MODULE ${i}.html`),
    count: 12,
  },
  {
    course: "bricepremiumcourses10",
    sourceDir: `${SOURCE_ROOT}/brice_premiummodules12`,
    filename: (i) => `HT_MODULE ${i}.html`,
    count: 12,
  },
  {
    course: "bricepremiumcourses11",
    sourceDir: `${SOURCE_ROOT}/brice_premiummodules13`,
    filename: (i) => `MED_MODULE ${i}.html`,
    count: 12,
  },
  {
    course: "bricepremiumcourses12",
    sourceDir: `${SOURCE_ROOT}/brice_premiummodules14`,
    filename: hrFilename,
    count: 12,
  },
  {
    // Speaking volumes: source uses VOLUME {i}.html naming
    course: "bricepremiumcourses18",
    sourceDir: `${SOURCE_ROOT}/brice_businessenglish_filesspeaking 3readingvocabulary`,
    filename: (i) => `VOLUME ${i}.html`,
    count: 5,
  },
  {
    course: "bricepremiumcourses19",
    sourceDir: `${SOURCE_ROOT}/brice_premiumbusinessmodules 4`,
    filename: salesFilename,
    count: 12,
  },
];

/** Replace the Anthropic browser API call with our server-side proxy. */
function patchHtml(html) {
  return html
    .replace(
      /fetch\('https:\/\/api\.anthropic\.com\/v1\/messages'/g,
      "fetch('/api/writing-feedback'"
    )
    .replace(
      /\s*'anthropic-dangerous-direct-browser-access'\s*:\s*'true',?\s*/g,
      " "
    );
}

const filterCourse = process.argv[2] || null;
const filterModule = process.argv[3] ? Number(process.argv[3]) : null;

const courses = filterCourse
  ? COURSE_MAP.filter((c) => c.course === filterCourse)
  : COURSE_MAP;

if (filterCourse && courses.length === 0) {
  console.error(`No mapping found for: ${filterCourse}`);
  console.error(`Available: ${COURSE_MAP.map((c) => c.course).join(", ")}`);
  process.exit(1);
}

const totalModules = filterModule
  ? courses.length
  : courses.reduce((s, c) => s + c.count, 0);

console.log(`\nCopying ${totalModules} module(s) with Anthropic URL proxied...\n`);

let ok = 0;
let fail = 0;

for (const { course, sourceDir, filename, count } of courses) {
  const indices = filterModule ? [filterModule] : Array.from({ length: count }, (_, i) => i + 1);

  for (const i of indices) {
    const sourceFile = resolve(sourceDir, filename(i));
    const targetFile = resolve(CONTENT_ROOT, course, `module_${i}.html`);

    if (!existsSync(sourceFile)) {
      console.warn(`  ⚠ Source not found: ${filename(i)} (${course})`);
      fail++;
      continue;
    }
    if (!existsSync(targetFile)) {
      console.warn(`  ⚠ Target dir missing: ${course}/module_${i}.html`);
      fail++;
      continue;
    }

    const sourceHtml = readFileSync(sourceFile, "utf-8");
    const patched = patchHtml(sourceHtml);

    writeFileSync(targetFile, patched, "utf-8");
    const kb = Math.round(patched.length / 1024);
    console.log(`  ✓ ${course}/module_${i}.html  (${kb} KB)`);
    ok++;
  }
}

console.log(`\n${ok} copied, ${fail} failed.\n`);
