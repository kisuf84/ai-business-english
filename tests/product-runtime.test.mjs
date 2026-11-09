import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import {
  createAcademyLessonKeyMap,
  createCorporateLessonKeyMap,
  createLessonR2AdapterScript,
  getAcademyLessonContentKey,
  getCorporateLessonContentKey,
} from "../lib/standaloneLessonMapping.mjs";
import { getProductRuntimeAccess } from "../lib/productRuntimeAccess.mjs";
import { getOriginalHtmlWorkspace } from "../lib/productWorkspace.mjs";
import { getProductShellMode } from "../lib/langslateDomains.mjs";

const ROOT = path.resolve("private-product-workspaces");
const corporateCatalog = JSON.parse(await readFile("lib/generated/langslateCorporateCatalog.json", "utf8"));
const academyCatalog = JSON.parse(await readFile("lib/generated/langslateAcademyCatalog.json", "utf8"));

async function loadManifest(product) {
  const filename = path.join(ROOT, product, "js", "lessons.js");
  const source = await readFile(filename, "utf8");
  const context = {};
  vm.runInNewContext(`${source}\n;globalThis.__LESSONS__=LESSONS;`, context, { timeout: 5000 });
  return context.__LESSONS__;
}

function createUrlMap(keyMap) {
  return Object.fromEntries(Object.entries(keyMap).map(([identity, key]) => [
    identity,
    { contentKey: key, url: `https://r2.example.test/v1/${key}` },
  ]));
}

test("original Corporate workspace runtime and required assets are integrated privately", async () => {
  const index = await readFile(path.join(ROOT, "corporate", "index.html"), "utf8");
  const app = await readFile(path.join(ROOT, "corporate", "js", "app.js"), "utf8");
  assert.match(index, /js\/lessons\.js/);
  assert.match(index, /js\/r2-lesson-adapter\.js/);
  assert.ok(index.indexOf("r2-lesson-adapter.js") < index.indexOf("js/app.js"));
  for (const label of ["Professions", "Industries", "Departments", "Langslate Pro"]) assert.ok(app.includes(label));
  assert.ok((await readFile(path.join(ROOT, "corporate", "images", "logo.png"))).byteLength > 0);
});

test("original Academy workspace runtime uses the case-correct logo and keeps 552 source entries", async () => {
  const index = await readFile(path.join(ROOT, "academy", "index.html"), "utf8");
  const app = await readFile(path.join(ROOT, "academy", "js", "app.js"), "utf8");
  const lessons = await loadManifest("academy");
  assert.match(index, /images\/Logo\.png/);
  assert.ok(index.indexOf("r2-lesson-adapter.js") < index.indexOf("js/app.js"));
  for (const label of ["All Courses", "CEFR Levels", "Progress", "Achievements"]) assert.ok(index.includes(label) || app.includes(label));
  assert.equal(lessons.length, 552);
  assert.ok((await readFile(path.join(ROOT, "academy", "images", "Logo.png"))).byteLength > 0);
});

test("all 4,054 original Corporate manifest rows map to existing R2 catalog objects", async () => {
  const lessons = await loadManifest("corporate");
  const keyMap = createCorporateLessonKeyMap(corporateCatalog);
  assert.equal(lessons.length, 4054);
  const keys = lessons.map((lesson) => getCorporateLessonContentKey(lesson, keyMap));
  assert.equal(keys.filter(Boolean).length, 4054);
  assert.equal(new Set(keys).size, 4054);

  const storage = new Map([["lc_state_v2", JSON.stringify({ xp: 21, completed: { [keys[0]]: 100 } })]]);
  const context = {
    LESSONS: lessons,
    localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, value); },
    },
  };
  vm.runInNewContext(createLessonR2AdapterScript("corporate", createUrlMap(keyMap)), context, { timeout: 5000 });
  assert.ok(lessons.every((lesson) => lesson.url.startsWith("https://r2.example.test/v1/corporate/")));
  const migratedCorporateState = JSON.parse(storage.get("lc_state_v1"));
  assert.equal(migratedCorporateState.xp, 21);
  assert.equal(migratedCorporateState.completed[String(lessons[0].id)], 100);
  assert.ok(storage.has("lc_state_v2"), "the prior React progress record is retained");
});

test("all 552 original Academy rows map to R2, including the five renamed A1 files", async () => {
  const lessons = await loadManifest("academy");
  const keyMap = createAcademyLessonKeyMap(academyCatalog);
  assert.equal(lessons.length, 552);
  const keys = lessons.map((lesson) => getAcademyLessonContentKey(lesson, keyMap));
  assert.equal(keys.filter(Boolean).length, 552);
  assert.equal(new Set(keys).size, 552);

  const renamed = lessons.filter((lesson) => /^lesson\d+_/i.test(path.basename(lesson.filename)));
  assert.equal(renamed.length, 5);
  assert.ok(renamed.every((lesson) => getAcademyLessonContentKey(lesson, keyMap)));

  const storage = new Map([["la_state_v4", JSON.stringify({ xp: 13, completed: { [keys[0]]: 101 } })]]);
  const context = {
    LESSONS: lessons,
    localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, value); },
    },
  };
  vm.runInNewContext(createLessonR2AdapterScript("academy", createUrlMap(keyMap)), context, { timeout: 5000 });
  assert.ok(lessons.every((lesson) => lesson.url.startsWith("https://r2.example.test/v1/academy/")));
  const migratedAcademyState = JSON.parse(storage.get("la_state_v4"));
  assert.equal(migratedAcademyState.xp, 13);
  assert.equal(migratedAcademyState.completed[String(lessons[0].id)], 101);
});

test("protected runtime access denies unauthenticated and wrong-product host requests", () => {
  assert.equal(getProductRuntimeAccess("langslatecorporate.com", "corporate", false), "unauthenticated");
  assert.equal(getProductRuntimeAccess("langslateacademy.com", "corporate", true), "wrong-host");
  assert.equal(getProductRuntimeAccess("langslatecorporate.com", "corporate", true), "allow");
});

test("main host, product isolation, Flow and 365 workspace selections remain intact", () => {
  assert.equal(getProductShellMode("ai-business-english.vercel.app"), "main");
  assert.equal(getProductShellMode("langslate.co"), "main");
  assert.deepEqual(getOriginalHtmlWorkspace("flow"), { src: "/content/langslate-flow/app", title: "Langslate Flow" });
  assert.deepEqual(getOriginalHtmlWorkspace("365"), { src: "/content/langslate-365/course", title: "Langslate 365" });
  assert.equal(getOriginalHtmlWorkspace("corporate"), null);
  assert.equal(getOriginalHtmlWorkspace("academy"), null);
});
