/**
 * Pre-renders bricepremiumcourses modules that have empty section containers.
 * These modules generate exercise content dynamically via DOMContentLoaded,
 * so the static HTML files are empty. This script runs the JS headlessly,
 * captures the fully-rendered DOM, strips all script tags, then injects a
 * fixed showSection function for modules that use JS show/hide navigation.
 */

import puppeteer from "puppeteer";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../premium-content/premium-classes");

// Modules to pre-render: { path, injectShowSection }
// injectShowSection=true for modules using onclick="showSection(...)" nav pattern
const MODULES = [
  // course2 — showSection nav (inject fixed function after stripping scripts)
  { rel: "bricepremiumcourses2/module_1.html",  injectShowSection: true },
  { rel: "bricepremiumcourses2/module_2.html",  injectShowSection: true },
  { rel: "bricepremiumcourses2/module_3.html",  injectShowSection: true },
  { rel: "bricepremiumcourses2/module_4.html",  injectShowSection: true },
  { rel: "bricepremiumcourses2/module_5.html",  injectShowSection: true },
  { rel: "bricepremiumcourses2/module_8.html",  injectShowSection: true },
  // course2 — anchor nav (href="#sec-..."), no showSection needed
  { rel: "bricepremiumcourses2/module_6.html",  injectShowSection: false },
  { rel: "bricepremiumcourses2/module_7.html",  injectShowSection: false },
  { rel: "bricepremiumcourses2/module_9.html",  injectShowSection: false },
  { rel: "bricepremiumcourses2/module_11.html", injectShowSection: false },
  { rel: "bricepremiumcourses2/module_12.html", injectShowSection: false },
  // course3 — anchor nav
  { rel: "bricepremiumcourses3/module_2.html",  injectShowSection: false },
  { rel: "bricepremiumcourses3/module_3.html",  injectShowSection: false },
  { rel: "bricepremiumcourses3/module_9.html",  injectShowSection: false },
];

// Fixed showSection: maps the bare nav IDs to the actual sec-* element IDs.
// fixSectionIds.mjs renamed elements (overview→sec-overview, vocabulary→sec-vocab, etc.)
// but did not update the onclick call arguments, so the old function broke.
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

function stripScripts(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

function injectScript(html, scriptBody) {
  const bodyEnd = html.lastIndexOf("</body>");
  const tag = `<script>\n${scriptBody}\n</script>\n`;
  if (bodyEnd === -1) return html + tag;
  return html.slice(0, bodyEnd) + tag + html.slice(bodyEnd);
}

async function prerender({ rel, injectShowSection }) {
  const filePath = resolve(ROOT, rel);
  const moduleName = rel;
  console.log(`\nPre-rendering ${moduleName}...`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.on("pageerror", () => {});
  page.on("console", () => {});

  const fileUrl = `file://${filePath}`;
  await page.goto(fileUrl, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1200));

  // Verify speaking section was populated
  const speakingFilled = await page.evaluate(() => {
    const grid =
      document.querySelector("#speakingGrid") ||
      document.querySelector(".speaking-grid");
    return grid ? grid.children.length > 0 : false;
  });

  if (!speakingFilled) {
    await browser.close();
    throw new Error(`${moduleName}: speaking section still empty after render — aborting`);
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
  console.log(`  ✓ Saved ${moduleName} (${output.length.toLocaleString()} bytes)${injectShowSection ? " + showSection injected" : ""}`);
}

async function main() {
  for (const mod of MODULES) {
    await prerender(mod);
  }

  console.log("\nVerifying output...");
  for (const { rel, injectShowSection } of MODULES) {
    const filePath = resolve(ROOT, rel);
    const html = readFileSync(filePath, "utf-8");
    const scripts = (html.match(/<script\b/gi) || []).length;
    const speaking = (html.match(/speaking-card|speaking-q|q-text|class="q "/gi) || []).length;
    const hasFn = /function showSection/.test(html);
    const status = injectShowSection
      ? `scripts=${scripts}, speaking≈${speaking}, showSection=${hasFn ? "✓" : "✗"}`
      : `scripts=${scripts}, speaking≈${speaking}`;
    console.log(`  ${rel}: ${status}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
