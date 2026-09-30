#!/usr/bin/env node
/**
 * Uploads the dry-run upload plan to R2 via the Wrangler CLI (uses the
 * operator's existing `wrangler login`; no keys are read or stored here).
 *
 * SAFE BY DEFAULT: without --execute it only prints what it would do.
 *
 *   LANGSLATE_SEPT10_SOURCE=... LANGSLATE_MIGRATION_STAGING=... \
 *   LANGSLATE_R2_BUCKET=<bucket> \
 *   LANGSLATE_CONTENT_BASE_URL=https://<public-content-host>/v1 \
 *   node scripts/langslate-migration/upload.mjs [--execute] [--only corporate/] [--concurrency 8]
 *
 *   ... --verify   HEAD every planned object at $LANGSLATE_CONTENT_BASE_URL/<contentKey>
 *                  and compare status, Content-Type, Content-Length and ETag
 *                  (R2's single-part ETag is the object's MD5, so this checks
 *                  content without downloading it).
 *
 * Per object: if the public URL already serves identical content (type,
 * length, ETag == MD5) it is skipped as verified; otherwise the file is
 * re-hashed (must match the plan's SHA-256), uploaded with an explicit
 * Content-Type, then re-checked over HTTP. Transient failures are retried
 * with exponential backoff; permanent ones (hash drift, auth, missing
 * bucket) are not. Progress goes to $STAGING/upload-log.jsonl, and re-runs
 * skip objects already logged as done with the same SHA-256.
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
const MAX_ATTEMPTS = 4;
const DONE_STATUSES = new Set(["uploaded", "replaced", "verified-existing"]);

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class PermanentError extends Error {}

function publicBaseUrl(required) {
  const base = process.env.LANGSLATE_CONTENT_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base && required) throw new Error("Set LANGSLATE_CONTENT_BASE_URL (public base including /v1).");
  return base || null;
}

function objectUrl(base, contentKey) {
  return `${base}/${contentKey.split("/").map(encodeURIComponent).join("/")}`;
}

/** HEAD with retries for rate limiting / transient network errors. */
async function head(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { method: "HEAD", cache: "no-store" });
      if ((res.status === 429 || res.status >= 500) && attempt < MAX_ATTEMPTS) {
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      return {
        status: res.status,
        type: res.headers.get("content-type"),
        length: Number(res.headers.get("content-length")),
        etag: (res.headers.get("etag") || "").replace(/^W\//, "").replace(/"/g, ""),
      };
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS) return { status: 0, error: String(error.message) };
      await sleep(1000 * 2 ** attempt);
    }
  }
}

function matches(h, entry, contentType) {
  return h.status === 200 && h.type === contentType && h.length === entry.size && h.etag === entry.md5;
}

async function readLog(file) {
  const done = new Map();
  try {
    for (const line of (await fs.readFile(file, "utf8")).split("\n")) {
      if (!line.trim()) continue;
      const row = JSON.parse(line);
      if (DONE_STATUSES.has(row.status)) done.set(row.objectKey, row.sha256);
    }
  } catch {
    // no log yet
  }
  return done;
}

async function mapLimit(items, limit, fn) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        await fn(items[index], index);
      }
    })
  );
}

async function putObject(bucket, entry, file, contentType, cacheControl) {
  const args = ["wrangler", "r2", "object", "put", `${bucket}/${entry.objectKey}`, "--file", file, "--content-type", contentType, "--remote"];
  if (cacheControl) args.push("--cache-control", cacheControl);
  for (let attempt = 1; ; attempt++) {
    try {
      await run("npx", args, { maxBuffer: 4 << 20, timeout: 180000 });
      return attempt;
    } catch (error) {
      const text = `${error.stderr || ""}${error.stdout || ""}${error.message || ""}`;
      if (/authentic|not authorized|unauthori[sz]ed|forbidden|bucket does not exist|code: 10006|code: 10000/i.test(text)) {
        throw new PermanentError(text.replace(/\s+/g, " ").slice(0, 300));
      }
      if (attempt >= MAX_ATTEMPTS) throw new Error(`gave up after ${attempt} attempts: ${text.replace(/\s+/g, " ").slice(0, 300)}`);
      await sleep(2000 * 2 ** (attempt - 1));
    }
  }
}

async function verify(entries, contentType, concurrency) {
  const base = publicBaseUrl(true);
  const bad = [];
  const groups = {};
  let checked = 0;
  await mapLimit(entries, concurrency, async (e) => {
    const h = await head(objectUrl(base, e.contentKey));
    const [product, family] = e.contentKey.split("/");
    const group = `${product}/${family}`;
    groups[group] = groups[group] ?? { ok: 0, bad: 0 };
    if (matches(h, e, contentType)) groups[group].ok++;
    else {
      groups[group].bad++;
      bad.push({ contentKey: e.contentKey, got: h, expected: { size: e.size, md5: e.md5, contentType } });
    }
    if (++checked % 500 === 0) console.log(`verified ${checked}/${entries.length}`);
  });
  const summary = {
    verified: entries.length,
    ok: entries.length - bad.length,
    mismatches: bad.length,
    byGroup: Object.fromEntries(Object.entries(groups).sort()),
    sample: bad.slice(0, 20),
  };
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

async function main() {
  const sourceRoot = requireSourceRoot();
  const stagingDir = requireStagingDir();
  assertSafeStaging(stagingDir, sourceRoot, REPO_ROOT);
  const plan = JSON.parse(await fs.readFile(path.join(stagingDir, "upload-plan.json"), "utf8"));
  const only = arg("--only");
  const entries = plan.entries.filter((e) => !only || e.contentKey.startsWith(only));
  const concurrency = Math.max(1, Number(arg("--concurrency") ?? 8));

  if (process.argv.includes("--verify")) {
    const summary = await verify(entries, plan.contentType, Math.max(concurrency, 16));
    await fs.writeFile(path.join(stagingDir, "verify-report.json"), `${JSON.stringify(summary, null, 2)}\n`);
    if (summary.mismatches) process.exit(1);
    return;
  }

  const execute = process.argv.includes("--execute");
  const bucket = process.env.LANGSLATE_R2_BUCKET;
  const base = publicBaseUrl(false);
  const cacheControl = process.env.LANGSLATE_CONTENT_CACHE_CONTROL;
  const logFile = path.join(stagingDir, "upload-log.jsonl");
  const done = await readLog(logFile);
  const pending = entries.filter((e) => done.get(e.objectKey) !== e.sha256);

  console.log(
    JSON.stringify(
      {
        mode: execute ? "EXECUTE" : "dry-run (pass --execute to upload)",
        bucket: bucket ?? "(LANGSLATE_R2_BUCKET not set)",
        precheckBaseUrl: base ?? "(not set: existing objects cannot be recognized, all pending will upload)",
        filter: only ?? "(all)",
        planned: entries.length,
        alreadyDoneInLog: entries.length - pending.length,
        pending: pending.length,
        pendingBytes: pending.reduce((sum, e) => sum + e.size, 0),
        fromStaging: pending.filter((e) => e.from === "staging").length,
        contentType: plan.contentType,
        cacheControl: cacheControl ?? "(not set)",
        concurrency,
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

  const counts = { uploaded: 0, replaced: 0, "verified-existing": 0, failed: 0, retried: 0 };
  let processed = 0;
  let permanentStop = null;
  const startedAt = Date.now();

  await mapLimit(pending, concurrency, async (e) => {
    if (permanentStop) return;
    const file = path.join(e.from === "staging" ? stagingDir : sourceRoot, e.relativePath);
    const row = { objectKey: e.objectKey, sha256: e.sha256, md5: e.md5, size: e.size, from: e.from, transforms: e.transforms };
    try {
      let existing = null;
      if (base) {
        existing = await head(objectUrl(base, e.contentKey));
        if (matches(existing, e, plan.contentType)) {
          counts["verified-existing"]++;
          await fs.appendFile(logFile, `${JSON.stringify({ ...row, status: "verified-existing", at: new Date().toISOString() })}\n`);
          return;
        }
      }
      if ((await sha256OfFile(file)) !== e.sha256) throw new PermanentError("SHA-256 changed since dry run");
      const attempts = await putObject(bucket, e, file, plan.contentType, cacheControl);
      if (attempts > 1) counts.retried++;

      let after = null;
      if (base) {
        for (let i = 0; i < 5; i++) {
          after = await head(objectUrl(base, e.contentKey));
          if (matches(after, e, plan.contentType)) break;
          await sleep(1500 * (i + 1));
        }
        if (!matches(after, e, plan.contentType)) throw new Error(`post-upload check failed: ${JSON.stringify(after)}`);
      }
      const status = existing && existing.status === 200 ? "replaced" : "uploaded";
      counts[status]++;
      await fs.appendFile(
        logFile,
        `${JSON.stringify({ ...row, status, attempts, ...(status === "replaced" ? { previous: existing } : {}), at: new Date().toISOString() })}\n`
      );
    } catch (error) {
      counts.failed++;
      const permanent = error instanceof PermanentError;
      await fs.appendFile(
        logFile,
        `${JSON.stringify({ ...row, status: "failed", permanent, error: String(error.message).slice(0, 400), at: new Date().toISOString() })}\n`
      );
      if (permanent && /authentic|authori|forbidden|bucket does not exist|10006|10000/i.test(error.message)) {
        permanentStop = error.message;
      }
    } finally {
      processed++;
      if (processed % 250 === 0) {
        const secs = Math.round((Date.now() - startedAt) / 1000);
        console.log(`${processed}/${pending.length} in ${secs}s ${JSON.stringify(counts)}`);
      }
    }
  });

  const summary = { ...counts, processed, seconds: Math.round((Date.now() - startedAt) / 1000), stoppedEarly: permanentStop };
  console.log(JSON.stringify(summary, null, 2));
  if (counts.failed || permanentStop) process.exit(1);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
