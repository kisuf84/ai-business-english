#!/usr/bin/env node
/**
 * Full migration dry run over every manifest record. Uploads NOTHING.
 *
 *   LANGSLATE_SEPT10_SOURCE=... LANGSLATE_MIGRATION_STAGING=... \
 *   node scripts/langslate-migration/dry-run.mjs
 *
 * For each record: source exists, size + SHA-256 match the manifest, basic
 * HTML structure holds. Records flagged for transformation are transformed
 * into $STAGING/upload/<objectKey>, then re-validated (structure, inline
 * script syntax, exact single-span diff). Unchanged records are uploaded
 * straight from the read-only source later, so no copy is made.
 *
 * Writes $STAGING/upload-plan.json (consumed by upload.mjs) and
 * $STAGING/dry-run-report.json. Exits non-zero on any failure.
 */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  assertSafeStaging,
  isSafeContentKey,
  requireSourceRoot,
  requireStagingDir,
  md5OfBuffer,
  sha256OfBuffer,
  sha256OfFile,
} from "./lib.mjs";
import {
  JS_APOSTROPHE_REPAIR_TRANSFORM,
  REMOTE_AI_TRANSFORM,
  disableRemoteAi,
  repairJsApostrophes,
  scriptSyntaxErrors,
  structureProblems,
} from "./transform.mjs";

const TRANSFORMS = {
  [REMOTE_AI_TRANSFORM]: (html) => disableRemoteAi(html),
  [JS_APOSTROPHE_REPAIR_TRANSFORM]: (html, record) =>
    repairJsApostrophes(html, record.sourceRelativePath, record.sourceSha256),
};

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const CONTENT_TYPE = "text/html; charset=utf-8";

async function main() {
  const sourceRoot = requireSourceRoot();
  const stagingDir = requireStagingDir();
  assertSafeStaging(stagingDir, sourceRoot, REPO_ROOT);
  const manifest = JSON.parse(await fs.readFile(path.join(stagingDir, "manifest.json"), "utf8"));
  const uploadDir = path.join(stagingDir, "upload");
  await fs.rm(uploadDir, { recursive: true, force: true });

  const failures = {
    missingSource: [],
    sourceShaMismatch: [],
    sourceSizeMismatch: [],
    unsafeKey: [],
    failedTransformation: [],
    transformedStructure: [],
    transformedSyntax: [],
    unexpectedDiff: [],
  };
  // Pre-existing problems in the client's source files. Uploaded as-is (not
  // ours to fix silently); reported, not counted as pipeline failures.
  const info = { sourceStructureAnomalies: [], sourceScriptSyntaxErrors: [] };
  const plan = [];
  let transformed = 0;
  const transformCounts = {};
  const multiTransform = [];
  let unchanged = 0;
  const bytes = { total: 0, corporate: 0, academy: 0, transformedDelta: 0 };

  for (const record of manifest.records) {
    const rel = record.sourceRelativePath;
    const abs = path.join(sourceRoot, rel);
    if (!isSafeContentKey(record.contentKey)) failures.unsafeKey.push(record.contentKey);

    let buffer;
    try {
      buffer = await fs.readFile(abs);
    } catch {
      failures.missingSource.push(rel);
      continue;
    }
    if (buffer.length !== record.sourceSize) failures.sourceSizeMismatch.push(rel);
    if (sha256OfBuffer(buffer) !== record.sourceSha256) {
      failures.sourceShaMismatch.push(rel);
      continue;
    }

    const html = buffer.toString("utf8");
    const problems = structureProblems(html);
    if (problems.length) info.sourceStructureAnomalies.push({ path: rel, problems });
    const sourceSyntax = scriptSyntaxErrors(html);
    if (sourceSyntax.length) info.sourceScriptSyntaxErrors.push({ path: rel, errors: sourceSyntax });

    let entry = {
      objectKey: record.objectKey,
      contentKey: record.contentKey,
      contentType: CONTENT_TYPE,
      from: "source",
      relativePath: rel,
      size: record.sourceSize,
      sha256: record.sourceSha256,
      md5: md5OfBuffer(buffer),
      transforms: [],
    };

    if (record.transforms.length) {
      // Apply the record's transforms in order; each step's change offsets
      // are relative to that step's input.
      let out = html;
      const steps = [];
      try {
        for (const transform of record.transforms) {
          const apply = TRANSFORMS[transform];
          if (!apply) throw new Error(`unknown transform ${transform}`);
          const result = apply(out, record);
          steps.push({ transform, changes: result.changes });
          out = result.output;
        }
      } catch (error) {
        failures.failedTransformation.push({ path: rel, error: error.message });
        continue;
      }

      const outProblems = structureProblems(out);
      if (outProblems.length) failures.transformedStructure.push({ path: rel, problems: outProblems });
      const outSyntax = scriptSyntaxErrors(out);
      // Remote-AI removal must not add errors; an apostrophe repair must leave none.
      const maxSyntaxErrors = record.transforms.includes(JS_APOSTROPHE_REPAIR_TRANSFORM) ? 0 : sourceSyntax.length;
      if (outSyntax.length > maxSyntaxErrors) failures.transformedSyntax.push({ path: rel, errors: outSyntax });

      // The only differences must be the recorded spans: undo every change
      // (last step first, highest offset first) and require the source back.
      // Change offsets are in the step's input coordinates, so shift each by
      // the length delta of the earlier changes in the same step.
      let reconstructed = out;
      for (const step of [...steps].reverse()) {
        const ordered = [...step.changes].sort((a, b) => a.offset - b.offset);
        let shift = 0;
        const positioned = ordered.map((change) => {
          const at = change.offset + shift;
          shift += change.inserted.length - change.removed.length;
          return { ...change, at };
        });
        for (const change of positioned.reverse()) {
          if (reconstructed.slice(change.at, change.at + change.inserted.length) !== change.inserted) {
            reconstructed = null;
            break;
          }
          reconstructed =
            reconstructed.slice(0, change.at) + change.removed + reconstructed.slice(change.at + change.inserted.length);
        }
        if (reconstructed === null) break;
      }
      if (reconstructed !== html) failures.unexpectedDiff.push(rel);

      const outBuffer = Buffer.from(out, "utf8");
      const target = path.join(uploadDir, record.objectKey);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, outBuffer);
      entry = {
        ...entry,
        from: "staging",
        relativePath: path.posix.join("upload", record.objectKey),
        size: outBuffer.length,
        sha256: sha256OfBuffer(outBuffer),
        md5: md5OfBuffer(outBuffer),
        sourceSha256: record.sourceSha256,
        sourceSize: record.sourceSize,
        transforms: [...record.transforms],
        transformSteps: steps.map((step) => ({
          transform: step.transform,
          changes: step.changes.map((c) => ({
            offset: c.offset,
            removed: c.removed,
            inserted: c.inserted,
            byteDelta: Buffer.byteLength(c.inserted) - Buffer.byteLength(c.removed),
          })),
        })),
      };
      bytes.transformedDelta += outBuffer.length - record.sourceSize;
      for (const t of record.transforms) transformCounts[t] = (transformCounts[t] ?? 0) + 1;
      if (record.transforms.length > 1) multiTransform.push(rel);
      transformed++;
    } else {
      unchanged++;
    }

    bytes.total += entry.size;
    bytes[record.product] += entry.size;
    plan.push(entry);
  }

  // The source tree must be byte-identical after the run.
  const postRunShaMismatch = [];
  for (const record of manifest.records.filter((r) => r.transforms.length)) {
    if ((await sha256OfFile(path.join(sourceRoot, record.sourceRelativePath))) !== record.sourceSha256)
      postRunShaMismatch.push(record.sourceRelativePath);
  }

  const failureCounts = Object.fromEntries(Object.entries(failures).map(([k, v]) => [k, v.length]));
  failureCounts.postRunSourceShaMismatch = postRunShaMismatch.length;
  const totalFailures = Object.values(failureCounts).reduce((a, b) => a + b, 0);

  const report = {
    manifestRecords: manifest.records.length,
    planned: plan.length,
    transformed,
    transformCounts,
    multiTransformRecords: multiTransform,
    unchanged,
    bytes,
    failureCounts,
    failures: { ...failures, postRunShaMismatch },
    info: {
      sourceFilesWithStructureAnomalies: info.sourceStructureAnomalies.length,
      sourceFilesWithPreexistingScriptSyntaxErrors: info.sourceScriptSyntaxErrors.length,
      ...info,
    },
    uploaded: 0,
  };
  await fs.writeFile(path.join(stagingDir, "upload-plan.json"), `${JSON.stringify({ contentType: CONTENT_TYPE, entries: plan }, null, 2)}\n`);
  await fs.writeFile(path.join(stagingDir, "dry-run-report.json"), `${JSON.stringify(report, null, 2)}\n`);

  console.log(JSON.stringify({ ...report, failures: undefined, info: { ...report.info, sourceStructureAnomalies: undefined, sourceScriptSyntaxErrors: undefined } }, null, 2));
  if (totalFailures) {
    console.error(`\n${totalFailures} failure(s). See dry-run-report.json.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
