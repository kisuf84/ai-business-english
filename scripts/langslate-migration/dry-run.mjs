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
  sha256OfBuffer,
  sha256OfFile,
} from "./lib.mjs";
import {
  REMOTE_AI_TRANSFORM,
  disableRemoteAi,
  scriptSyntaxErrors,
  structureProblems,
} from "./transform.mjs";

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
      transforms: [],
    };

    if (record.transforms.includes(REMOTE_AI_TRANSFORM)) {
      let result;
      try {
        result = disableRemoteAi(html);
      } catch (error) {
        failures.failedTransformation.push({ path: rel, error: error.message });
        continue;
      }
      const out = result.output;
      const outProblems = structureProblems(out);
      if (outProblems.length) failures.transformedStructure.push({ path: rel, problems: outProblems });
      const outSyntax = scriptSyntaxErrors(out);
      if (outSyntax.length > sourceSyntax.length) failures.transformedSyntax.push({ path: rel, errors: outSyntax });

      // The only difference must be the single replaced span.
      const [change] = result.changes;
      const reconstructed =
        out.slice(0, change.offset) + change.removed + out.slice(change.offset + change.inserted.length);
      if (result.changes.length !== 1 || reconstructed !== html) failures.unexpectedDiff.push(rel);

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
        sourceSha256: record.sourceSha256,
        sourceSize: record.sourceSize,
        transforms: [REMOTE_AI_TRANSFORM],
      };
      bytes.transformedDelta += outBuffer.length - record.sourceSize;
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
