/**
 * Comprehensive audit of all 36 bricepremiumcourses HTML modules.
 *
 * Checks:
 *  A) Sidebar navigation – does each nav onclick/href target an element that exists?
 *  B) Empty sections – do sections contain actual content or just empty container divs?
 *
 * Usage:
 *   node scripts/auditModules.mjs
 */

import { readFileSync } from "fs";
import { join } from "path";

const ROOT = new URL("../premium-content/premium-classes", import.meta.url).pathname;
const COURSES = [
  "bricepremiumcourses1", "bricepremiumcourses2", "bricepremiumcourses3",
  "bricepremiumcourses4", "bricepremiumcourses5", "bricepremiumcourses6",
  "bricepremiumcourses7", "bricepremiumcourses8", "bricepremiumcourses9",
  "bricepremiumcourses10", "bricepremiumcourses11", "bricepremiumcourses12",
  "bricepremiumcourses13", "bricepremiumcourses14", "bricepremiumcourses15",
  "bricepremiumcourses16", "bricepremiumcourses17", "bricepremiumcourses18",
  "bricepremiumcourses19",
];
// course5 has 13 modules, course18 has 5; use max 13 and skip missing files
// course5 has 13 modules; all others 12; use max 13 and skip missing files
const MODULES = Array.from({ length: 13 }, (_, i) => `module_${i + 1}.html`);

// Containers that are known to be populated dynamically by JS
const DYNAMIC_CONTAINERS = [
  // courses 1-3 template
  "speakingGrid", "wordbankGrid", "readingContent", "writingContent",
  "grammarReviewContent", "vocab-ex-0", "grammar-ex-0",
  "listenContent", "casestudiesContent", "assessmentContent",
  // courses 4-6 template (goTo/init* pattern)
  "speakingContent", "overviewContent", "wordBankContent", "listeningContent",
  "gramRevContent", "casesContent", "assessContainer",
  "vex-0", "gex-0",
];

function auditFile(filePath, courseName, moduleName) {
  let html;
  try {
    html = readFileSync(filePath, "utf-8");
  } catch {
    return null; // file doesn't exist
  }

  const issues = [];
  const info = [];

  // ── DETECT NAVIGATION PATTERN ──────────────────────────────────────────────
  // Anchor-based (href="#...") vs JS show/hide (onclick="showXxx('...')")
  const anchorLinks = [...html.matchAll(/href="#([^"]+)"/g)].map(m => m[1]);
  const onclickTargets = [...html.matchAll(/onclick="show(?:Section|Sec)\('([^']+)'\)"/g)].map(m => m[1]);

  // Detect which JS function name is used
  const usesShowSection = /onclick="showSection\(/.test(html);
  const usesShowSec = /onclick="showSec\(/.test(html);
  const usesGoTo = /onclick="goTo\(/.test(html);
  const hasShowSectionDef = /function showSection\b/.test(html);
  const hasShowSecDef = /function showSec\b/.test(html);
  const hasGoToDef = /function goTo\b/.test(html);
  // Detect whether the function has already been patched with our mapping table.
  // Use \b to prevent showSection from matching the showSec pattern (prefix overlap).
  const hasFixedShowSection = /function showSection\b[^{]*\{[^}]*var M=/.test(html);
  const hasFixedShowSec = /function showSec\b[^{]*\{[^}]*var M=/.test(html);

  // ── DETECT SECTION ELEMENT IDs ─────────────────────────────────────────────
  // Match all id="..." on elements that look like sections
  const sectionDivIds = new Set(
    [...html.matchAll(/(?:class="section[^"]*"|id="sec-[^"]*"[^>]*class="section|class="section[^"]*"[^>]*id="([^"]+)")/g)]
      .map(m => m[1])
      .filter(Boolean)
  );

  // More reliable: find ALL id="..." values in the document
  const allIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));

  // Section containers specifically (divs with class="section")
  const sectionElementIds = [...html.matchAll(/<(?:div|section)[^>]*class="[^"]*\bsection\b[^"]*"[^>]*id="([^"]+)"/g)]
    .map(m => m[1]);
  // Also get the reverse order
  const sectionElementIds2 = [...html.matchAll(/<(?:div|section)[^>]*id="([^"]+)"[^>]*class="[^"]*\bsection\b[^"]*"/g)]
    .map(m => m[1]);
  const sectionIds = new Set([...sectionElementIds, ...sectionElementIds2]);

  // ── ISSUE A: SIDEBAR NAV MATCHES ──────────────────────────────────────────
  // For pre-rendered brice courses: showSection/showSec/goTo are all injected
  // by route.ts at serve time, so missing definitions in the static file are expected
  // once scripts are stripped (scriptCount = 0). Only flag if scripts are still present.
  const scriptCount = (html.match(/<script\b/gi) || []).length;
  if (usesShowSection && !hasShowSectionDef && scriptCount > 0) {
    issues.push(`MISSING_FN: showSection() used but not defined`);
  }
  if (usesShowSec && !hasShowSecDef && scriptCount > 0) {
    issues.push(`MISSING_FN: showSec() used but not defined`);
  }
  if (usesGoTo && !hasGoToDef && scriptCount > 0) {
    issues.push(`MISSING_FN: goTo() used but not defined`);
  }

  // ID mappings applied by the fixed functions (showSection and showSec differ)
  const FIXED_MAP_SHOW_SECTION = {
    vocabulary: "sec-vocab",
    "grammar-review": "sec-gramreview",
    casestudies: "sec-cases",
  };
  const FIXED_MAP_SHOW_SEC = {
    "gr-review": "sec-grammar-review",
  };
  const fixedMap = hasFixedShowSec ? FIXED_MAP_SHOW_SEC : FIXED_MAP_SHOW_SECTION;

  // Check each onclick target resolves to an element (accounting for the fixed mapping)
  const navMismatches = [];
  const fnIsFixed = hasFixedShowSection || hasFixedShowSec;
  for (const target of onclickTargets) {
    if (allIds.has(target)) continue; // bare ID exists — fine
    const mapped = fnIsFixed ? (fixedMap[target] || "sec-" + target) : ("sec-" + target);
    if (!allIds.has(mapped)) {
      navMismatches.push(`'${target}' → not found (tried '${mapped}' too)`);
    } else if (!fnIsFixed) {
      // Function exists but hasn't been patched yet — still a mismatch
      navMismatches.push(`'${target}' → should be '${mapped}' (sec- prefix missing in nav)`);
    }
    // else: fnIsFixed and mapped ID exists → nav will work via the mapping table
  }
  if (navMismatches.length > 0) {
    issues.push(`NAV_MISMATCH(${navMismatches.length}): ` + navMismatches.join("; "));
  }

  // For anchor-based (module_2 style) check hrefs
  const anchorMismatches = [];
  for (const target of anchorLinks) {
    // Skip non-section anchors (like external links etc)
    if (/^https?:/.test(target)) continue;
    if (!allIds.has(target) && (target.startsWith("sec-") || ["casestudy","final","sec-speaking","sec-wordbank"].includes(target))) {
      anchorMismatches.push(`'${target}'`);
    }
  }
  if (anchorMismatches.length > 0) {
    issues.push(`ANCHOR_MISMATCH: ${anchorMismatches.join(", ")}`);
  }

  // ── ISSUE B: EMPTY SECTION CONTENT ────────────────────────────────────────
  const emptySections = [];
  for (const containerId of DYNAMIC_CONTAINERS) {
    // Pattern: id="containerId"></div> or id="containerId" ...></div> with nothing inside
    const emptyPattern = new RegExp(`id="${containerId}"[^>]*>\\s*</`, "g");
    if (emptyPattern.test(html)) {
      emptySections.push(containerId);
    }
  }
  if (emptySections.length > 0) {
    issues.push(`EMPTY_CONTENT(${emptySections.length}): ${emptySections.join(", ")}`);
  }

  // ── STATS ──────────────────────────────────────────────────────────────────
  const navPattern = usesShowSection ? "showSection" : usesShowSec ? "showSec" : usesGoTo ? "goTo" : "anchor";
  const fnDefined = usesShowSection ? hasShowSectionDef : usesShowSec ? hasShowSecDef : usesGoTo ? hasGoToDef : true;
  const fnFixed = usesShowSection ? hasFixedShowSection : usesShowSec ? hasFixedShowSec : true;
  const navCount = onclickTargets.length || anchorLinks.filter(h => !h.startsWith("http")).length;

  return {
    course: courseName,
    module: moduleName,
    navPattern,
    fnDefined,
    navTargets: onclickTargets.length,
    navMismatches: navMismatches.length,
    sectionCount: sectionIds.size,
    emptySections: emptySections.length,
    emptyList: emptySections,
    issues,
    needsPrerender: emptySections.length > 0,
    needsNavFix: navMismatches.length > 0 || (usesShowSection && !hasShowSectionDef && scriptCount > 0) || (usesShowSec && !hasShowSecDef && scriptCount > 0) || (usesGoTo && !hasGoToDef && scriptCount > 0),
  };
}

// ── RUN AUDIT ──────────────────────────────────────────────────────────────
const results = [];
for (const course of COURSES) {
  for (const mod of MODULES) {
    const filePath = join(ROOT, course, mod);
    const result = auditFile(filePath, course, mod);
    if (result) results.push(result);
  }
}

// ── PRINT RESULTS ──────────────────────────────────────────────────────────
const pass = results.filter(r => r.issues.length === 0);
const fail = results.filter(r => r.issues.length > 0);
const needPrerender = results.filter(r => r.needsPrerender);
const needNavFix = results.filter(r => r.needsNavFix);

console.log("\n╔══════════════════════════════════════════════════════════════════╗");
console.log(`║  MODULE AUDIT — ${results.length} files scanned                              ║`);
console.log("╚══════════════════════════════════════════════════════════════════╝\n");

console.log(`PASS: ${pass.length}  FAIL: ${fail.length}  (needs-prerender: ${needPrerender.length}  needs-nav-fix: ${needNavFix.length})\n`);

// Table header
console.log("FILE                            NAV-FN     NAV-OK  SECTIONS  EMPTY  STATUS");
console.log("─".repeat(90));

for (const r of results) {
  const file = `${r.course.replace("bricepremiumcourses","")}/${r.module.replace(".html","")}`.padEnd(30);
  const fn = r.navPattern.padEnd(12);
  const navOk = (r.navMismatches === 0 ? "✓" : `✗(${r.navMismatches})`).padEnd(8);
  const secs = String(r.sectionCount).padEnd(10);
  const empty = String(r.emptySections).padEnd(7);
  const status = r.issues.length === 0 ? "✓ PASS" : "✗ FAIL";
  console.log(`${file}${fn}${navOk}${secs}${empty}${status}`);
  for (const issue of r.issues) {
    console.log(`  → ${issue}`);
  }
}

// ── SUMMARY LISTS ─────────────────────────────────────────────────────────
if (needPrerender.length > 0) {
  console.log("\n\nMODULES REQUIRING PRE-RENDER:");
  for (const r of needPrerender) {
    console.log(`  ${r.course}/${r.module}  (empty: ${r.emptyList.join(", ")})`);
  }
}
if (needNavFix.length > 0) {
  console.log("\nMODULES REQUIRING NAV FIX:");
  for (const r of needNavFix) {
    const detail = r.issues.filter(i => i.startsWith("NAV") || i.startsWith("MISSING")).join("; ");
    console.log(`  ${r.course}/${r.module}  ${detail}`);
  }
}

console.log("\n");
