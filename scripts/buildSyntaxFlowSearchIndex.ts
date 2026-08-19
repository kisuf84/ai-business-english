#!/usr/bin/env node
/**
 * V1 full-text search index generator — Syntaxflow only (proof/validation
 * rollout before extending to the rest of the Langslate content library;
 * see the search-architecture investigation this implements).
 *
 * Syntaxflow's actual lesson content (the Spanish/French/Portuguese
 * sentences) lives inside inline <script> blocks as JSON-like data
 * (`const SENTENCES = [...]`), rendered into the DOM at runtime — it is
 * NOT in static DOM text. This script extracts BOTH: leftover static DOM
 * text (mostly generic template copy) and human-readable string literals
 * from embedded script data (the actual sentences), while discarding
 * base64 image data, CSS, and JS/code/URL noise.
 *
 * Does NOT modify any source HTML. Not part of the app runtime — run
 * manually (`node scripts/buildSyntaxFlowSearchIndex.ts`) when Syntaxflow
 * content changes. Output is a committed static JSON artifact loaded once
 * by the search route at module-init (no runtime HTML parsing).
 */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeSearchText } from "../lib/textNormalize.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_ROOT = path.join(ROOT, "content-library");
const OUT_PATH = path.join(ROOT, "lib", "generated", "syntaxFlowSearchIndex.json");

const SYNTAX_FLOW_LIBRARIES = [
  "syntax-flow-espanol",
  "syntax-flow-francais",
  "syntax-flow-portugues",
] as const;

const BASE64_RE = /data:[a-zA-Z0-9/+.-]+;base64,[A-Za-z0-9+/=]+/g;
const STYLE_RE = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
const SCRIPT_RE = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
const TAG_RE = /<[^>]+>/g;
// Double- or single-quoted string literals, 4-2000 chars, from script bodies.
const STRING_LITERAL_RE = /"((?:[^"\\]|\\.){4,2000})"|'((?:[^'\\]|\\.){4,2000})'/g;

const CODE_NOISE_RE = /[<>{}]|function|=>|px;|\$\{/;
const URL_OR_MARKUP_START_RE = /^(https?:|\/|#|data:|rgba?\()/;

type IndexRecord = {
  library: string;
  slug: string;
  chunks: string[];
  normalizedChunks: string[];
};

function isProseLikeLiteral(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  const words = s.split(/\s+/);
  if (words.length < 3) return false;
  if (!/[A-Za-zÀ-ÖØ-öø-ÿ]{2,}/.test(s)) return false;
  if (CODE_NOISE_RE.test(s)) return false;
  if (URL_OR_MARKUP_START_RE.test(s)) return false;
  return true;
}

function extractChunks(html: string): string[] {
  const noBase64 = html.replace(BASE64_RE, "");
  const noStyle = noBase64.replace(STYLE_RE, "");

  const scriptBlocks: string[] = [];
  const scriptScan = new RegExp(SCRIPT_RE);
  let scriptMatch: RegExpExecArray | null;
  while ((scriptMatch = scriptScan.exec(noStyle))) {
    scriptBlocks.push(scriptMatch[1]);
  }
  const nonScript = noStyle.replace(SCRIPT_RE, " ");

  const chunks: string[] = [];

  // Leftover static DOM text (mostly generic template copy for this
  // library, but included for generality — matches the investigation's
  // "extract meaningful static DOM text" requirement).
  const domText = nonScript.replace(TAG_RE, " ").replace(/\s+/g, " ").trim();
  if (domText.length > 20) {
    chunks.push(domText);
  }

  // Human-readable literals from embedded lesson data (the actual sentence
  // content for Syntaxflow).
  const seen = new Set<string>();
  for (const block of scriptBlocks) {
    const literalScan = new RegExp(STRING_LITERAL_RE);
    let literalMatch: RegExpExecArray | null;
    while ((literalMatch = literalScan.exec(block))) {
      const raw = (literalMatch[1] ?? literalMatch[2] ?? "").trim();
      if (!raw || seen.has(raw)) continue;
      if (!isProseLikeLiteral(raw)) continue;
      seen.add(raw);
      chunks.push(raw);
    }
  }

  return chunks;
}

async function buildLibraryRecords(library: string): Promise<IndexRecord[]> {
  const dir = path.join(CONTENT_ROOT, library);
  const entries = await fs.readdir(dir);
  const htmlFiles = entries.filter((f) => f.endsWith(".html")).sort();

  const records: IndexRecord[] = [];
  for (const file of htmlFiles) {
    const slug = file.replace(/\.html$/, "");
    const html = await fs.readFile(path.join(dir, file), "utf-8");
    const chunks = extractChunks(html);
    const normalizedChunks = chunks.map(normalizeSearchText);
    records.push({ library, slug, chunks, normalizedChunks });
  }
  return records;
}

async function main() {
  const allRecords: IndexRecord[] = [];
  for (const library of SYNTAX_FLOW_LIBRARIES) {
    const records = await buildLibraryRecords(library);
    allRecords.push(...records);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    libraries: SYNTAX_FLOW_LIBRARIES,
    records: allRecords,
  };

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(output, null, 2), "utf-8");

  const totalChunks = allRecords.reduce((sum, r) => sum + r.chunks.length, 0);
  const totalChars = allRecords.reduce(
    (sum, r) => sum + r.chunks.reduce((s, c) => s + c.length, 0),
    0
  );
  const outStat = await fs.stat(OUT_PATH);

  console.log(`Indexed lessons: ${allRecords.length}`);
  console.log(`Total chunks: ${totalChunks}`);
  console.log(`Total extracted text: ${(totalChars / 1024).toFixed(1)} KB`);
  console.log(`Output: ${OUT_PATH} (${(outStat.size / 1024).toFixed(1)} KB)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
