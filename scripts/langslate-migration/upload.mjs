#!/usr/bin/env node
/**
 * Uploads the dry-run upload plan to R2 via the Wrangler CLI (uses the
 * operator's existing `wrangler login`; no keys are read or stored here).
 *
 * SAFE BY DEFAULT: without --execute it only prints what it would do.
 *
 *   LANGSLATE_SEPT10_SOURCE=... LANGSLATE_MIGRATION_STAGING=... \
 *   LANGSLATE_R2_BUCKET=<bucket> \
 *   node scripts/langslate-migration/upload.mjs [--execute] [--only corporate/] [--concurrency 6]
 *
 *   ... --verify   HEAD every planned object at $LANGSLATE_CONTENT_BASE_URL/<contentKey>
 *                  and compare status, Content-Type and Content-Length.
 *
 * Every file is re-hashed immediately before its upload and must match the
 * plan. Progress is appended to $STAGING/upload-log.jsonl; re-runs skip
 * objects already logged with the same SHA-256 (resumable).
 * Run dry-run.mjs first — it produces upload-plan.json.
 */
import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { assertSafeStaging, requireSourceRoot, requireStagingDir, sha256OfFile } from "./lib.mjs";

const run = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function readLog(file) {
  const done = new Map();
  try {
    for (const line of (await fs.readFile(file, "utf8")).split("\n")) {
      if (!line.trim()) continue;
      const row = JSON.parse(line);
      if (row.status === "uploaded") done.set(row.objectKey, row.sha256);
    }
  } catch {
    // no log yet
  }
  return done;
}

async function verify(entries) {
  const base = process.env.LANGSLATE_CONTENT_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base) throw new Error("Set LANGSLATE_CONTENT_BASE_URL (public base including /v1) to verify.");
  const bad = [];
  let checked = 0;
  for (const e of entries) {
    const url = `${base}/${e.contentKey.split("/").map(encodeURIComponent).join("/")}`;
    const res = await fetch(url, { method: "HEAD" });
    const type = res.headers.get("content-type");
    const length = Number(res.headers.get("content-length"));
    if (res.status !== 200 || type !== e.contentType || length !== e.size) {
      bad.push({ contentKey: e.contentKey, status: res.status, type, length, expected: e.size });
    }
    if (++checked % 250 === 0) console.log(`verified ${checked}/${entries.length}`);
  }
  console.log(JSON.stringify({ verified: entries.length, mismatches: bad.length, sample: bad.slice(0, 20) }, null, 2));
  if (bad.length) process.exit(1);
}

async function main() {
  const sourceRoot = requireSourceRoot();
  const stagingDir = requireStagingDir();
  assertSafeStaging(stagingDir, sourceRoot, REPO_ROOT);
  const plan = JSON.parse(await fs.readFile(path.join(stagingDir, "upload-plan.json"), "utf8"));
  const only = arg("--only");
  const entries = plan.entries.filter((e) => !only || e.contentKey.startsWith(only));

  if (process.argv.includes("--verify")) return verify(entries);

  const execute = process.argv.includes("--execute");
  const bucket = process.env.LANGSLATE_R2_BUCKET;
  const cacheControl = process.env.LANGSLATE_CONTENT_CACHE_CONTROL;
  const concurrency = Math.max(1, Number(arg("--concurrency") ?? 6));
  const logFile = path.join(stagingDir, "upload-log.jsonl");
  const done = await readLog(logFile);
  const pending = entries.filter((e) => done.get(e.objectKey) !== e.sha256);
  const bytes = pending.reduce((sum, e) => sum + e.size, 0);

  console.log(
    JSON.stringify(
      {
        mode: execute ? "EXECUTE" : "dry-run (pass --execute to upload)",
        bucket: bucket ?? "(LANGSLATE_R2_BUCKET not set)",
        filter: only ?? "(all)",
        planned: entries.length,
        alreadyUploaded: entries.length - pending.length,
        pending: pending.length,
        pendingBytes: bytes,
        fromStaging: pending.filter((e) => e.from === "staging").length,
        contentType: plan.contentType,
        cacheControl: cacheControl ?? "(not set)",
      },
      null,
      2
    )
  );

  if (!execute) {
    for (const e of pending.slice(0, 3)) console.log(`would upload ${e.from}:${e.relativePath} -> ${e.objectKey}`);
    return;
  }
  if (!bucket) throw new Error("LANGSLATE_R2_BUCKET is required with --execute.");

  let next = 0;
  let failed = 0;
  let uploaded = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < pending.length) {
        const e = pending[next++];
        const file = path.join(e.from === "staging" ? stagingDir : sourceRoot, e.relativePath);
        const row = { objectKey: e.objectKey, sha256: e.sha256, size: e.size, at: new Date().toISOString() };
        try {
          if ((await sha256OfFile(file)) !== e.sha256) throw new Error("SHA-256 changed since dry run");
          const args = ["wrangler", "r2", "object", "put", `${bucket}/${e.objectKey}`, "--file", file, "--content-type", plan.contentType, "--remote"];
          if (cacheControl) args.push("--cache-control", cacheControl);
          await run("npx", args, { maxBuffer: 1 << 20 });
          uploaded++;
          await fs.appendFile(logFile, `${JSON.stringify({ ...row, status: "uploaded" })}\n`);
        } catch (error) {
          failed++;
          await fs.appendFile(logFile, `${JSON.stringify({ ...row, status: "failed", error: String(error.message).slice(0, 300) })}\n`);
        }
        if ((uploaded + failed) % 100 === 0) console.log(`${uploaded + failed}/${pending.length} (failed ${failed})`);
      }
    })
  );
  console.log(JSON.stringify({ uploaded, failed }, null, 2));
  if (failed) process.exit(1);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
