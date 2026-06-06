/**
 * Dry-run: node scripts/fixSectionIds.mjs
 * Apply:   node scripts/fixSectionIds.mjs --apply
 *
 * Renames section IDs in bricepremiumcourses1-3 HTML files to match the
 * app-standard sec-* scheme used by PremiumModuleReader's sectionLinks.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const APPLY = process.argv.includes("--apply");
const ROOT = new URL("../premium-content/premium-classes", import.meta.url).pathname;

const COURSES = ["bricepremiumcourses1", "bricepremiumcourses2", "bricepremiumcourses3"];
const MODULES = Array.from({ length: 12 }, (_, i) => `module_${i + 1}.html`);

// Order matters: more-specific patterns before their prefixes.
// Each entry is [exactIdValue, replacement] — matched as id="VALUE".
const REPLACEMENTS = [
  // section-* prefix variants (bricepremiumcourses1 module_1)
  ["section-grammar-review", "sec-gramreview"],
  ["section-grammar",        "sec-grammar"],
  ["section-overview",       "sec-overview"],
  ["section-speaking",       "sec-speaking"],
  ["section-reading",        "sec-reading"],
  ["section-vocabulary",     "sec-vocab"],
  ["section-wordbank",       "sec-wordbank"],
  ["section-listening",      "sec-listening"],
  // bare variants (bricepremiumcourses1 module_2-12, courses 2 and 3)
  ["grammar-review",         "sec-gramreview"],
  ["grammar",                "sec-grammar"],
  ["overview",               "sec-overview"],
  ["speaking",               "sec-speaking"],
  ["reading",                "sec-reading"],
  ["vocabulary",             "sec-vocab"],
  ["wordbank",               "sec-wordbank"],
  ["writing",                "sec-writing"],
  ["listening",              "sec-listening"],
  ["casestudies",            "sec-cases"],
  ["assessment",             "sec-assessment"],
];

function applyReplacements(html) {
  let out = html;
  for (const [from, to] of REPLACEMENTS) {
    // Match id="EXACT" — the closing " ensures we don't hit partial matches
    // e.g. id="grammar" won't touch id="grammarReviewContent"
    out = out.replaceAll(`id="${from}"`, `id="${to}"`);
  }
  return out;
}

let totalFiles = 0;
let changedFiles = 0;

for (const course of COURSES) {
  for (const module of MODULES) {
    const filePath = join(ROOT, course, module);
    let original;
    try {
      original = readFileSync(filePath, "utf-8");
    } catch {
      continue; // file doesn't exist, skip
    }

    totalFiles++;
    const updated = applyReplacements(original);

    if (updated === original) {
      console.log(`  unchanged  ${course}/${module}`);
      continue;
    }

    changedFiles++;

    // Show which IDs changed
    for (const [from, to] of REPLACEMENTS) {
      const before = (original.match(new RegExp(`id="${from}"`, "g")) || []).length;
      const after  = (updated.match(new RegExp(`id="${to}"`, "g"))    || []).length;
      if (before > 0) {
        console.log(`  ${APPLY ? "APPLIED" : "DRY RUN"}  ${course}/${module}  id="${from}" → id="${to}"  (${before} occurrence${before > 1 ? "s" : ""})`);
      }
    }

    if (APPLY) {
      writeFileSync(filePath, updated, "utf-8");
    }
  }
}

console.log(`\n${APPLY ? "Applied" : "Dry run complete"}. ${changedFiles} of ${totalFiles} files would be ${APPLY ? "updated" : "changed"}.`);
if (!APPLY) console.log('Run with --apply to write changes.');
