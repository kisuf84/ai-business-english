/**
 * Pre-renders bricepremiumcourses modules that have empty section containers.
 * These modules generate exercise content dynamically via DOMContentLoaded,
 * so the static HTML files are empty. This script runs the JS headlessly,
 * captures the fully-rendered DOM, strips all script tags, then injects a
 * fixed showSection function for modules that use JS show/hide navigation.
 *
 * Two render strategies:
 *  - "domcontentloaded": courses 1–3 render all content on DOMContentLoaded
 *  - "visit-sections": courses 4–6 render content lazily via goTo()/init*() per section
 */

import puppeteer from "puppeteer";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../premium-content/premium-classes");

// All sections to visit for courses 4–6 (goTo/init* lazy-render template)
const GOTO_SECTIONS = [
  "overview", "speaking", "wordbank", "reading", "vocab",
  "grammar", "gramreview", "writing", "listening", "cases", "assessment",
];

// Fixed showSection for courses 1–3 modules that use showSection nav pattern.
// Maps bare nav IDs to sec-* element IDs (fixSectionIds.mjs renamed elements but not nav calls).
const FIXED_SHOW_SECTION = `
function showSection(id) {
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
}
`.trim();

// ── MODULE LIST ────────────────────────────────────────────────────────────

function goToModules(course, count) {
  return Array.from({ length: count }, (_, i) => ({
    rel: `${course}/module_${i + 1}.html`,
    strategy: "visit-sections",
    injectShowSection: false,
  }));
}

// course12 (HR): all init* called on DOMContentLoaded, not lazily via goTo
// course16 (B2): builds all panels upfront; course19 (Sales): uses load event
function dclModules(course, count, { waitUntil = "domcontentloaded", delay = 1200 } = {}) {
  return Array.from({ length: count }, (_, i) => ({
    rel: `${course}/module_${i + 1}.html`,
    strategy: "domcontentloaded",
    injectShowSection: false,
    waitUntil,
    delay,
  }));
}

const MODULES = [
  // courses 1–3: render on DOMContentLoaded ─────────────────────────────────
  // course2 — showSection nav (inject fixed function after stripping scripts)
  { rel: "bricepremiumcourses2/module_1.html",  strategy: "domcontentloaded", injectShowSection: true },
  { rel: "bricepremiumcourses2/module_2.html",  strategy: "domcontentloaded", injectShowSection: true },
  { rel: "bricepremiumcourses2/module_3.html",  strategy: "domcontentloaded", injectShowSection: true },
  { rel: "bricepremiumcourses2/module_4.html",  strategy: "domcontentloaded", injectShowSection: true },
  { rel: "bricepremiumcourses2/module_5.html",  strategy: "domcontentloaded", injectShowSection: true },
  { rel: "bricepremiumcourses2/module_8.html",  strategy: "domcontentloaded", injectShowSection: true },
  // course2 — anchor nav, no showSection needed
  { rel: "bricepremiumcourses2/module_6.html",  strategy: "domcontentloaded", injectShowSection: false },
  { rel: "bricepremiumcourses2/module_7.html",  strategy: "domcontentloaded", injectShowSection: false },
  { rel: "bricepremiumcourses2/module_9.html",  strategy: "domcontentloaded", injectShowSection: false },
  { rel: "bricepremiumcourses2/module_11.html", strategy: "domcontentloaded", injectShowSection: false },
  { rel: "bricepremiumcourses2/module_12.html", strategy: "domcontentloaded", injectShowSection: false },
  // course3 — anchor nav
  { rel: "bricepremiumcourses3/module_2.html",  strategy: "domcontentloaded", injectShowSection: false },
  { rel: "bricepremiumcourses3/module_3.html",  strategy: "domcontentloaded", injectShowSection: false },
  { rel: "bricepremiumcourses3/module_9.html",  strategy: "domcontentloaded", injectShowSection: false },

  // courses 4–6: lazy goTo/init* render — must visit every section ──────────
  ...goToModules("bricepremiumcourses4", 12),
  ...goToModules("bricepremiumcourses5", 13),
  ...goToModules("bricepremiumcourses6", 12),

  // courses 13–15: reading content (A1/A2/B1) — showCat nav, text-grid ──────
  ...dclModules("bricepremiumcourses13", 4),
  ...dclModules("bricepremiumcourses14", 4),
  ...dclModules("bricepremiumcourses15", 4),

  // courses 7–12: same goTo/init* template ─────────────────────────────────
  ...goToModules("bricepremiumcourses7",  12),
  ...goToModules("bricepremiumcourses8",  12),
  ...goToModules("bricepremiumcourses9",  12),
  ...goToModules("bricepremiumcourses10", 12),
  ...goToModules("bricepremiumcourses11", 12),
  ...dclModules("bricepremiumcourses12", 12),

  // courses 16–19: batch 4 ──────────────────────────────────────────────────
  // course16 (B2): builds all panels at script exec; switchCat toggles visibility
  ...dclModules("bricepremiumcourses16", 4),
  // course17 (C1): scripts kept intact — no pre-render needed
  // course18 (Speaking): all static content — no pre-render needed
  // course19 (Sales): uses window.load event; use networkidle0 to ensure load fires
  ...dclModules("bricepremiumcourses19", 12, { waitUntil: "networkidle0", delay: 500 }),
];

// ── HELPERS ────────────────────────────────────────────────────────────────

function stripScripts(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

function injectScript(html, scriptBody) {
  const bodyEnd = html.lastIndexOf("</body>");
  const tag = `<script>\n${scriptBody}\n</script>\n`;
  if (bodyEnd === -1) return html + tag;
  return html.slice(0, bodyEnd) + tag + html.slice(bodyEnd);
}

// ── RENDER STRATEGIES ──────────────────────────────────────────────────────

async function renderDomContentLoaded(page, filePath, { waitUntil = "domcontentloaded", delay = 1200 } = {}) {
  await page.goto(`file://${filePath}`, { waitUntil });
  await new Promise((r) => setTimeout(r, delay));

  const speakingFilled = await page.evaluate(() => {
    // Various grid/panel containers used across different course templates
    const grid = document.querySelector("#speakingGrid") || document.querySelector(".speaking-grid")
      || document.querySelector(".text-grid") || document.querySelector(".texts-grid")
      || document.querySelector("#grid0") || document.querySelector("#g0");
    if (grid && grid.children.length > 0) return true;
    // Panel-based reading modules (B1 style) populate .text-panel and .sidebar-item
    if (document.querySelector(".text-panel, .sidebar-item, .text-card") !== null) return true;
    // Sales modules (course19): renderMCQ populates [id$="-mcqs"] containers
    const mcqEl = document.querySelector('[id$="-mcqs"]');
    if (mcqEl && mcqEl.children.length > 0) return true;
    return false;
  });
  if (!speakingFilled) {
    throw new Error(`speaking section still empty after DOMContentLoaded render`);
  }
}

async function renderVisitSections(page, filePath) {
  await page.goto(`file://${filePath}`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 800));

  // Visit each section to trigger its init* function
  for (const section of GOTO_SECTIONS) {
    await page.evaluate((s) => {
      if (typeof goTo === "function") goTo("sec-" + s);
    }, section);
    await new Promise((r) => setTimeout(r, 300));
  }

  // Verify speaking content was populated
  const speakingFilled = await page.evaluate(() => {
    const el = document.getElementById("speakingContent");
    return el ? el.children.length > 0 : false;
  });
  if (!speakingFilled) {
    throw new Error(`speakingContent still empty after visiting all sections`);
  }
}

// ── MAIN PRE-RENDER ────────────────────────────────────────────────────────

async function prerender({ rel, strategy, injectShowSection, waitUntil, delay }) {
  const filePath = resolve(ROOT, rel);
  process.stdout.write(`  Pre-rendering ${rel}...`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.on("pageerror", () => {});
  page.on("console", () => {});

  try {
    if (strategy === "visit-sections") {
      await renderVisitSections(page, filePath);
    } else {
      await renderDomContentLoaded(page, filePath, { waitUntil, delay });
    }

    const renderedHtml = await page.evaluate(
      () => "<!DOCTYPE html>\n" + document.documentElement.outerHTML
    );
    await browser.close();

    let output = stripScripts(renderedHtml);
    if (injectShowSection) {
      output = injectScript(output, FIXED_SHOW_SECTION);
    }

    writeFileSync(filePath, output, "utf-8");
    console.log(` ✓ (${(output.length / 1024).toFixed(0)} KB)${injectShowSection ? " +showSection" : ""}`);
  } catch (err) {
    await browser.close();
    throw new Error(`${rel}: ${err.message}`);
  }
}

async function main() {
  // Accept optional filter arg: node prerenderBriceModules.mjs bricepremiumcourses4
  const filter = process.argv[2] || null;
  const queue = filter ? MODULES.filter((m) => m.rel.startsWith(filter)) : MODULES;

  console.log(`\nPre-rendering ${queue.length} modules${filter ? ` (filter: ${filter})` : ""}...\n`);

  for (const mod of queue) {
    await prerender(mod);
  }

  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error("\nFATAL:", err.message);
  process.exit(1);
});
