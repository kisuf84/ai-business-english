/**
 * Fixes broken showSection / showSec navigation functions in premium module HTML files.
 *
 * Root cause: fixSectionIds.mjs renamed section element IDs to use the sec-* scheme
 * (e.g. id="overview" → id="sec-overview", id="vocabulary" → id="sec-vocab") but
 * did not update the onclick call arguments in sidebar nav items. The old showSection
 * function called getElementById(id) with the bare name, which no longer matches.
 *
 * Fix: replace the existing broken function with one that maps bare nav IDs to the
 * correct sec-* element IDs. For modules where the function is missing entirely
 * (stripped by a previous prerender pass), inject it before </body>.
 *
 * This script is safe to re-run — it detects already-fixed functions and skips them.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../premium-content/premium-classes");

// ── FIXED FUNCTION BODIES ────────────────────────────────────────────────────

// Standard showSection for most modules (course1/m1, course2/m10, all course3).
// Maps: vocabulary→sec-vocab, grammar-review→sec-gramreview, casestudies→sec-cases.
const FIXED_SHOW_SECTION = `function showSection(id) {
  var M={'vocabulary':'sec-vocab','grammar-review':'sec-gramreview','casestudies':'sec-cases'};
  var eid=M[id]||('sec-'+id);
  document.querySelectorAll('.section').forEach(function(s){s.classList.remove('active');});
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
  var el=document.getElementById(eid);
  if(!el)el=document.getElementById(id);
  if(el)el.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(function(n){
    if((n.getAttribute('onclick')||'').indexOf("'"+id+"'")!==-1)n.classList.add('active');
  });
  window.scrollTo({top:0,behavior:'smooth'});
  if(typeof trackProgress==='function')trackProgress(id);
}`;

// showSec for course1/module_9 — that module uses sec-grammar-review (not sec-gramreview)
// and sec-vocabulary (not sec-vocab). The nav calls showSec('gr-review') and showSec('vocabulary').
const FIXED_SHOW_SEC = `function showSec(id){
  var M={'gr-review':'sec-grammar-review'};
  var eid=M[id]||('sec-'+id);
  document.querySelectorAll('.section').forEach(function(s){s.classList.remove('active');});
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
  var el=document.getElementById(eid);
  if(!el)el=document.getElementById(id);
  if(el)el.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(function(n){
    if((n.getAttribute('onclick')||'').indexOf("'"+id+"'")!==-1)n.classList.add('active');
  });
  window.scrollTo({top:0,behavior:'smooth'});
}`;

// ── MODULES TO FIX ───────────────────────────────────────────────────────────

const MODULES = [
  // course1 — replace broken showSection (uses 'section-' + id, sections now use sec-* IDs)
  { rel: "bricepremiumcourses1/module_1.html",  action: "replace", fn: "showSection", fixed: FIXED_SHOW_SECTION },
  // course1 — replace broken showSec
  { rel: "bricepremiumcourses1/module_9.html",  action: "replace", fn: "showSec",     fixed: FIXED_SHOW_SEC },
  // course1 m11, m12 — function was stripped by previous prerender pass, must inject
  { rel: "bricepremiumcourses1/module_11.html", action: "inject",  fn: "showSection", fixed: FIXED_SHOW_SECTION },
  { rel: "bricepremiumcourses1/module_12.html", action: "inject",  fn: "showSection", fixed: FIXED_SHOW_SECTION },
  // course2 m10 — nav-only fix (content already present, just showSection broken)
  { rel: "bricepremiumcourses2/module_10.html", action: "replace", fn: "showSection", fixed: FIXED_SHOW_SECTION },
  // course3 — all modules with showSection (no empty content, just nav mismatch)
  { rel: "bricepremiumcourses3/module_1.html",  action: "replace", fn: "showSection", fixed: FIXED_SHOW_SECTION },
  { rel: "bricepremiumcourses3/module_4.html",  action: "replace", fn: "showSection", fixed: FIXED_SHOW_SECTION },
  { rel: "bricepremiumcourses3/module_5.html",  action: "replace", fn: "showSection", fixed: FIXED_SHOW_SECTION },
  { rel: "bricepremiumcourses3/module_6.html",  action: "replace", fn: "showSection", fixed: FIXED_SHOW_SECTION },
  { rel: "bricepremiumcourses3/module_7.html",  action: "replace", fn: "showSection", fixed: FIXED_SHOW_SECTION },
  { rel: "bricepremiumcourses3/module_8.html",  action: "replace", fn: "showSection", fixed: FIXED_SHOW_SECTION },
  { rel: "bricepremiumcourses3/module_10.html", action: "replace", fn: "showSection", fixed: FIXED_SHOW_SECTION },
  { rel: "bricepremiumcourses3/module_11.html", action: "replace", fn: "showSection", fixed: FIXED_SHOW_SECTION },
  { rel: "bricepremiumcourses3/module_12.html", action: "replace", fn: "showSection", fixed: FIXED_SHOW_SECTION },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Replaces the entire function body (from `function fnName(` through its
 * matching closing `}`) with `replacement`. Returns null if not found.
 */
function replaceFunction(html, fnName, replacement) {
  const marker = `function ${fnName}(`;
  const start = html.indexOf(marker);
  if (start === -1) return null;

  // Find the opening brace
  const openBrace = html.indexOf("{", start);
  if (openBrace === -1) return null;

  // Walk forward counting braces to find the matching close
  let depth = 1;
  let pos = openBrace + 1;
  while (pos < html.length && depth > 0) {
    if (html[pos] === "{") depth++;
    else if (html[pos] === "}") depth--;
    pos++;
  }

  return html.slice(0, start) + replacement + html.slice(pos);
}

function injectBeforeBodyEnd(html, scriptBody) {
  const bodyEnd = html.lastIndexOf("</body>");
  const tag = `<script>\n${scriptBody}\n</script>\n`;
  if (bodyEnd === -1) return html + tag;
  return html.slice(0, bodyEnd) + tag + html.slice(bodyEnd);
}

/** Returns true if the function is already the fixed version (idempotency guard). */
function alreadyFixed(html, fnName) {
  const marker = `function ${fnName}(`;
  const start = html.indexOf(marker);
  if (start === -1) return false;
  // The fixed versions use the M={...} mapping table — check for that signature
  const snippet = html.slice(start, start + 120);
  return snippet.includes("var M=");
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

let fixed = 0;
let skipped = 0;
let errors = 0;

for (const { rel, action, fn, fixed: replacement } of MODULES) {
  const filePath = resolve(ROOT, rel);
  let html;
  try {
    html = readFileSync(filePath, "utf-8");
  } catch {
    console.error(`  ✗ MISSING: ${rel}`);
    errors++;
    continue;
  }

  if (alreadyFixed(html, fn)) {
    console.log(`  – skip ${rel} (already fixed)`);
    skipped++;
    continue;
  }

  let updated;
  if (action === "replace") {
    updated = replaceFunction(html, fn, replacement);
    if (updated === null) {
      console.error(`  ✗ ERROR ${rel}: function ${fn} not found for replacement`);
      errors++;
      continue;
    }
  } else {
    // inject — function is missing entirely
    updated = injectBeforeBodyEnd(html, replacement);
  }

  writeFileSync(filePath, updated, "utf-8");
  console.log(`  ✓ ${action === "inject" ? "injected" : "fixed"} ${rel}`);
  fixed++;
}

console.log(`\nDone. fixed=${fixed} skipped=${skipped} errors=${errors}\n`);
