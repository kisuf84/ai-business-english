#!/usr/bin/env node
/**
 * Builds the Sept 10 Langslate Corporate/Academy migration manifest and the
 * lightweight runtime catalogs. Reads the source tree; never writes to it.
 *
 *   LANGSLATE_SEPT10_SOURCE=".../Sept 10 migration" \
 *   LANGSLATE_MIGRATION_STAGING="/some/scratch/dir" \
 *   node scripts/langslate-migration/build-manifest.mjs
 *
 * Outputs:
 *   $STAGING/manifest.json                     migration manifest (tooling only, not committed)
 *   $STAGING/manifest-report.json              counts, exclusions, anomalies
 *   lib/generated/langslateCorporateCatalog.json  runtime metadata (committed)
 *   lib/generated/langslateAcademyCatalog.json    runtime metadata (committed)
 *
 * All outputs are deterministic for an unchanged source tree and contain
 * relative paths only.
 */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  ACADEMY_LEVELS,
  ACADEMY_ROOT,
  CORPORATE_FAMILIES,
  CORPORATE_ROOT,
  CONTENT_VERSION,
  assertSafeStaging,
  classifyCanonical,
  deriveDisplayTitle,
  discoverSources,
  isSafeContentKey,
  loadPrototypeManifest,
  numberFromAcademyFilename,
  numberFromCorporateFilename,
  numberFromHtmlTitle,
  objectKeyFor,
  readHtmlTitle,
  requireSourceRoot,
  requireStagingDir,
  sha256OfFile,
  slugify,
} from "./lib.mjs";
import { JS_APOSTROPHE_REPAIRS, JS_APOSTROPHE_REPAIR_TRANSFORM, REMOTE_AI_TRANSFORM } from "./transform.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const GENERATED_DIR = path.join(REPO_ROOT, "lib", "generated");

export const EXPECTED_COUNTS = {
  "corporate/industries": 600,
  "corporate/departments": 420,
  "corporate/pro": 432,
  "corporate/professions": 2602,
  corporate: 4054,
  academy: 553,
  total: 4607,
};

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await fn(items[index], index);
      }
    })
  );
  return results;
}

function titleCaseFolder(folder) {
  return folder
    .replace(/ 60$/, "")
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

async function main() {
  const sourceRoot = requireSourceRoot();
  const stagingDir = requireStagingDir();
  assertSafeStaging(stagingDir, sourceRoot, REPO_ROOT);
  await fs.mkdir(stagingDir, { recursive: true });

  const { accepted, excluded } = await discoverSources(sourceRoot);

  const corporateProto = await loadPrototypeManifest(sourceRoot, CORPORATE_ROOT);
  const academyProto = await loadPrototypeManifest(sourceRoot, ACADEMY_ROOT);
  const corporateProtoByPath = new Map(corporateProto.map((l) => [`${CORPORATE_ROOT}/${l.url}`, l]));
  const academyProtoByPath = new Map(academyProto.map((l) => [`${ACADEMY_ROOT}/${l.folder}/${l.filename}`, l]));
  // A1 lessons renamed after the prototype was generated
  // (lesson1_greetings.html -> Greetings.html): keep the client's prototype
  // position only when the topic name matches exactly and uniquely.
  const acceptedSet = new Set(accepted);
  const renamedPrototypeMatches = [];
  for (const [protoPath, proto] of [...academyProtoByPath]) {
    if (acceptedSet.has(protoPath)) continue;
    const topic = proto.filename.match(/^lesson\d+_(.+)\.html$/i)?.[1];
    if (!topic) continue;
    const candidates = accepted.filter(
      (rel) =>
        rel.startsWith(`${ACADEMY_ROOT}/${proto.folder}/`) &&
        !academyProtoByPath.has(rel) &&
        slugify(rel.split("/").pop().replace(/\.html$/i, "")) === slugify(topic)
    );
    if (candidates.length === 1) {
      academyProtoByPath.set(candidates[0], proto);
      renamedPrototypeMatches.push({ prototype: proto.filename, source: candidates[0] });
    }
  }
  const categoryLabels = new Map();
  for (const l of corporateProto) categoryLabels.set(`${l.section}|${l.category}`, l.categoryLabel);

  const records = await mapLimit(accepted, 16, async (rel) => {
    const abs = path.join(sourceRoot, rel);
    const identity = classifyCanonical(rel);
    const [stat, sha256, htmlTitle, html] = await Promise.all([
      fs.stat(abs),
      sha256OfFile(abs),
      readHtmlTitle(abs),
      fs.readFile(abs, "utf8"),
    ]);
    const proto = identity.product === "corporate" ? corporateProtoByPath.get(rel) : academyProtoByPath.get(rel);
    const { title, titleSource } = deriveDisplayTitle({
      htmlTitle,
      manifestTitle: proto?.title,
      product: identity.product,
    });

    const record = {
      product: identity.product,
      ...(identity.product === "corporate"
        ? {
            family: identity.family,
            category: identity.categorySlug,
            categoryLabel:
              categoryLabels.get(
                `${CORPORATE_FAMILIES.find((f) => f.slug === identity.family).manifestSection}|${identity.categoryFolder}`
              ) ?? titleCaseFolder(identity.categoryFolder),
          }
        : { level: identity.level }),
      slug: identity.slug,
      title,
      titleSource,
      htmlTitle,
      sourceRelativePath: rel,
      contentKey: identity.contentKey,
      objectKey: objectKeyFor(identity.contentKey),
      sourceSize: stat.size,
      sourceSha256: sha256,
      prototypeId: proto?.id ?? null,
      transforms: [
        ...(html.includes("api.anthropic.com") ? [REMOTE_AI_TRANSFORM] : []),
        ...(JS_APOSTROPHE_REPAIRS[rel] ? [JS_APOSTROPHE_REPAIR_TRANSFORM] : []),
      ],
    };

    if (identity.product === "corporate") {
      const fromFile = numberFromCorporateFilename(identity.fileName);
      const fromTitle = numberFromHtmlTitle(htmlTitle);
      record.numberFromFilename = fromFile;
      record.numberFromTitle = fromTitle;
      // Only trust a number both sources agree on, or the single source present.
      record.number =
        fromFile !== null && fromTitle !== null ? (fromFile === fromTitle ? fromFile : null) : fromFile ?? fromTitle;
    } else {
      const a0 = numberFromAcademyFilename(identity.fileName);
      record.module = a0?.module ?? null;
      record.number = a0?.lesson ?? null;
    }
    return record;
  });

  // Deterministic ordering: client prototype order first, then any lesson
  // missing from the prototype manifest, by source path.
  const familyRank = Object.fromEntries(CORPORATE_FAMILIES.map((f, i) => [f.slug, i]));
  const levelRank = Object.fromEntries(ACADEMY_LEVELS.map((l, i) => [l, i]));
  const firstProtoIdByCategory = new Map();
  for (const r of records) {
    if (r.product !== "corporate" || r.prototypeId === null) continue;
    const key = `${r.family}/${r.category}`;
    firstProtoIdByCategory.set(key, Math.min(firstProtoIdByCategory.get(key) ?? Infinity, r.prototypeId));
  }
  const academyProtoIndex = new Map(academyProto.map((l, i) => [l, i]));
  const academyOrder = new Map([...academyProtoByPath].map(([rel, l]) => [rel, academyProtoIndex.get(l)]));
  const sortKey = (r) =>
    r.product === "corporate"
      ? [0, familyRank[r.family], firstProtoIdByCategory.get(`${r.family}/${r.category}`) ?? Infinity, r.category, r.prototypeId ?? Infinity, r.sourceRelativePath]
      : [1, levelRank[r.level], 0, "", academyOrder.get(r.sourceRelativePath) ?? Infinity, r.sourceRelativePath];
  records.sort((a, b) => {
    const ka = sortKey(a);
    const kb = sortKey(b);
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] === kb[i]) continue;
      return ka[i] < kb[i] ? -1 : 1;
    }
    return 0;
  });

  // ---------------------------------------------------------------- validate
  const problems = [];
  const counts = { corporate: 0, academy: 0, total: records.length };
  for (const r of records) {
    counts[r.product]++;
    const group = r.product === "corporate" ? `corporate/${r.family}` : `academy/${r.level}`;
    counts[group] = (counts[group] ?? 0) + 1;
  }
  for (const [group, expected] of Object.entries(EXPECTED_COUNTS)) {
    if (counts[group] !== expected) problems.push(`count ${group}: expected ${expected}, found ${counts[group]}`);
  }

  const byKey = new Map();
  for (const r of records) {
    byKey.set(r.contentKey, [...(byKey.get(r.contentKey) ?? []), r.sourceRelativePath]);
    if (!isSafeContentKey(r.contentKey)) problems.push(`unsafe key ${r.contentKey}`);
    if (path.isAbsolute(r.sourceRelativePath) || r.sourceRelativePath.split("/").includes(".."))
      problems.push(`non-relative source path ${r.sourceRelativePath}`);
    if (!r.title) problems.push(`missing title ${r.sourceRelativePath}`);
  }
  for (const rel of Object.keys(JS_APOSTROPHE_REPAIRS)) {
    if (!records.some((r) => r.sourceRelativePath === rel)) problems.push(`registered repair has no canonical record: ${rel}`);
  }
  const collisions = [...byKey.entries()].filter(([, v]) => v.length > 1);
  for (const [key, paths] of collisions) problems.push(`key collision ${key}: ${paths.join(" | ")}`);

  const slugCollisions = [];
  const byRoute = new Map();
  for (const r of records) {
    const route = r.product === "corporate" ? `${r.family}/${r.category}/${r.slug}` : `${r.level}/${r.slug}`;
    if (byRoute.has(route)) slugCollisions.push(route);
    byRoute.set(route, true);
  }
  for (const route of slugCollisions) problems.push(`route slug collision ${route}`);

  const shaGroups = new Map();
  for (const r of records) shaGroups.set(r.sourceSha256, [...(shaGroups.get(r.sourceSha256) ?? []), r.sourceRelativePath]);
  const duplicateContent = [...shaGroups.values()].filter((v) => v.length > 1);
  for (const group of duplicateContent) problems.push(`duplicate content: ${group.join(" | ")}`);

  const numberDisagreements = records
    .filter((r) => r.product === "corporate" && r.numberFromFilename !== null && r.numberFromTitle !== null && r.numberFromFilename !== r.numberFromTitle)
    .map((r) => ({ path: r.sourceRelativePath, filename: r.numberFromFilename, title: r.numberFromTitle }));

  const notInPrototype = records.filter((r) => r.prototypeId === null).map((r) => r.sourceRelativePath);

  // ------------------------------------------------------------------ output
  const manifest = {
    manifestVersion: 1,
    contentVersion: CONTENT_VERSION,
    sourceLabel: "Sept 10 migration",
    counts,
    records,
  };

  const corporateCatalog = {
    version: 1,
    product: "corporate",
    families: CORPORATE_FAMILIES.map((family) => {
      const familyRecords = records.filter((r) => r.product === "corporate" && r.family === family.slug);
      const categories = [];
      for (const r of familyRecords) {
        let category = categories[categories.length - 1];
        if (!category || category.slug !== r.category) {
          category = { slug: r.category, label: r.categoryLabel, lessons: [] };
          categories.push(category);
        }
        category.lessons.push({ slug: r.slug, title: r.title, number: r.number, contentKey: r.contentKey });
      }
      return { slug: family.slug, label: family.label, categories };
    }),
  };

  const academyCatalog = {
    version: 1,
    product: "academy",
    levels: ACADEMY_LEVELS.map((level) => ({
      slug: level.toLowerCase(),
      label: level,
      lessons: records
        .filter((r) => r.product === "academy" && r.level === level)
        .map((r) => ({
          slug: r.slug,
          title: r.title,
          ...(r.module !== null ? { module: r.module } : {}),
          number: r.number,
          contentKey: r.contentKey,
        })),
    })),
  };

  // Category uniqueness inside a family must hold for grouping to be valid.
  for (const family of corporateCatalog.families) {
    const seen = new Set();
    for (const c of family.categories) {
      if (seen.has(c.slug)) problems.push(`category ${family.slug}/${c.slug} is not contiguous`);
      seen.add(c.slug);
    }
  }

  const excludedByReason = {};
  for (const e of excluded) excludedByReason[e.reason] = (excludedByReason[e.reason] ?? 0) + 1;

  const report = {
    discovered: accepted.length + excluded.length,
    accepted: accepted.length,
    excluded: excluded.length,
    excludedByReason,
    excludedFiles: excluded,
    counts,
    categoryCounts: Object.fromEntries(
      corporateCatalog.families.map((f) => [f.slug, { categories: f.categories.length, lessonsPerCategory: countBy(f.categories.map((c) => c.lessons.length)) }])
    ),
    keyCollisions: collisions.length,
    routeSlugCollisions: slugCollisions.length,
    duplicateContentGroups: duplicateContent.length,
    maxObjectKeyLength: Math.max(...records.map((r) => r.objectKey.length)),
    remoteAiTransformCount: records.filter((r) => r.transforms.includes(REMOTE_AI_TRANSFORM)).length,
    jsApostropheRepairCount: records.filter((r) => r.transforms.includes(JS_APOSTROPHE_REPAIR_TRANSFORM)).length,
    multiTransformRecords: records.filter((r) => r.transforms.length > 1).map((r) => r.sourceRelativePath),
    titleSources: countBy(records.map((r) => `${r.product}:${r.titleSource}`)),
    lessonNumbers: {
      corporateWithNumber: records.filter((r) => r.product === "corporate" && r.number !== null).length,
      corporateWithoutNumber: records.filter((r) => r.product === "corporate" && r.number === null).map((r) => r.sourceRelativePath),
      corporateFilenameTitleDisagreements: numberDisagreements,
      academyWithNumber: records.filter((r) => r.product === "academy" && r.number !== null).length,
    },
    renamedPrototypeMatches,
    notInPrototypeManifest: notInPrototype,
    problems,
  };

  await writeJson(path.join(stagingDir, "manifest.json"), manifest);
  await writeJson(path.join(stagingDir, "manifest-report.json"), report);
  await fs.mkdir(GENERATED_DIR, { recursive: true });
  await fs.writeFile(path.join(GENERATED_DIR, "langslateCorporateCatalog.json"), `${JSON.stringify(corporateCatalog)}\n`);
  await fs.writeFile(path.join(GENERATED_DIR, "langslateAcademyCatalog.json"), `${JSON.stringify(academyCatalog)}\n`);

  console.log(JSON.stringify({ ...report, excludedFiles: `${excluded.length} (see manifest-report.json)`, lessonNumbers: { ...report.lessonNumbers, corporateWithoutNumber: report.lessonNumbers.corporateWithoutNumber.length } }, null, 2));
  if (problems.length) {
    console.error(`\n${problems.length} problem(s) — manifest NOT valid.`);
    process.exit(1);
  }
}

function countBy(values) {
  const out = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
}

async function writeJson(file, data) {
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
