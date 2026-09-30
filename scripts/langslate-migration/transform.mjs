/**
 * Upload-copy transformations for Sept 10 lessons. Operates on buffers
 * only; callers write results to staging, never to the source tree.
 *
 * disable-remote-ai (Corporate Industries only, 100 files):
 * The "Get AI Feedback / Auto-Correct" writing task does
 *
 *   const offline = analyseWriting(...);          // always computed first
 *   try { ... const r = await fetch('https://api.anthropic.com/v1/messages', {...});
 *         clearTimeout(...); if (r.ok) { merge AI result into offline } }
 *   catch (e) { console.info('AI unavailable', ...) }
 *   renderFeedback(id, offline);                   // offline report
 *
 * The transform swaps ONLY the `fetch('https://api.anthropic.com/v1/messages'`
 * call head for `Promise.reject(new Error(...)`, keeping the original
 * options object as an ignored second argument. The awaited promise rejects,
 * the existing catch runs, and the existing offline report renders — the
 * same path lessons already take when the request fails. No request is made
 * and the student's text never leaves the browser. Nothing else in the file
 * changes.
 */
import vm from "vm";

export const REMOTE_AI_TRANSFORM = "disable-remote-ai";

const REMOTE_AI_CALL = /\bfetch\(\s*(['"`])https:\/\/api\.anthropic\.com\/v1\/messages\1\s*,/g;
const REMOTE_AI_REPLACEMENT =
  "/* langslate-migration: remote AI request disabled; offline feedback is used */Promise.reject(new Error('Remote AI feedback disabled'),";

export function needsRemoteAiTransform(html) {
  return html.includes("api.anthropic.com");
}

// ---------------------------------------------------------------------------
// repair-js-apostrophe (3 known Professions lessons):
// Each file's single main <script> fails to parse because an apostrophe sits
// unescaped inside a single-quoted string literal, so none of the lesson's
// JS runs. The repair is an explicit allowlist pinned to the exact source
// file + SHA-256 and the exact malformed literal(s); each literal must occur
// exactly once, and only its inner apostrophe is escaped (' -> \').

export const JS_APOSTROPHE_REPAIR_TRANSFORM = "repair-js-apostrophe";

export const JS_APOSTROPHE_REPAIRS = {
  "LANGSLATE CORPORATE/PROFESSIONS/ENTREPRENEUR/ENTREPRENEUR_MODULE_08_pitching-ideas.html": {
    sourceSha256: "e21ec0b78eb33a68948c46b4d59c2804f4402c34b1a427320975088d0037da3a",
    literals: [
      "'devil's advocate'",
      "'Excellent work — this reads like a founder whose idea clicks the first time it's explained.'",
    ],
  },
  "LANGSLATE CORPORATE/PROFESSIONS/MUSICIAN/MUSICIAN_MODULE_12_songwriting-and-composition.html": {
    sourceSha256: "dfb7944a110c1dc7c353b0eb7858d722fc7aed162340eb663ebf94edd834bf30",
    literals: ["'writer's block'"],
  },
  "LANGSLATE CORPORATE/PROFESSIONS/SOFTWARE DEVELOPER/DEVELOPER_MODULE_09_technical-decision-making.html": {
    sourceSha256: "a2156161590b84618c4a5caa5ccfcf64de3d12b230d0223da18105c03c8b7c56",
    literals: ["'devil's advocate'"],
  },
};

/**
 * Returns { output, changes } or throws. Fails closed unless the source hash
 * matches, every malformed literal occurs exactly once, and every inline
 * script parses afterwards.
 */
export function repairJsApostrophes(html, sourceRelativePath, sourceSha256) {
  const spec = JS_APOSTROPHE_REPAIRS[sourceRelativePath];
  if (!spec) throw new Error("no apostrophe repair registered for this file");
  if (spec.sourceSha256 !== sourceSha256) throw new Error(`source SHA-256 ${sourceSha256} differs from the pinned repair source`);

  const changes = [];
  for (const literal of spec.literals) {
    const first = html.indexOf(literal);
    if (first < 0 || html.indexOf(literal, first + 1) >= 0) {
      throw new Error(`expected exactly one occurrence of ${literal}`);
    }
    const inner = literal.slice(1, -1);
    const apostrophes = [...inner.matchAll(/'/g)];
    if (apostrophes.length !== 1) throw new Error(`expected exactly one inner apostrophe in ${literal}`);
    const offset = first + 1 + apostrophes[0].index;
    changes.push({ offset, removed: "'", inserted: "\\'" });
  }

  // Apply from the end so earlier offsets stay valid; report offsets in
  // source coordinates, ascending.
  changes.sort((a, b) => a.offset - b.offset);
  let output = html;
  for (const change of [...changes].reverse()) {
    output = output.slice(0, change.offset) + change.inserted + output.slice(change.offset + change.removed.length);
  }
  const syntax = scriptSyntaxErrors(output);
  if (syntax.length) throw new Error(`scripts still fail to parse: ${syntax.join("; ")}`);
  return { output, changes };
}

/**
 * Returns { output, changes } or throws with a precise reason. Guards:
 * exactly one call site; it must be awaited; it must sit inside a try block
 * whose catch follows it; no other reference to the Anthropic host remains.
 */
export function disableRemoteAi(html) {
  const matches = [...html.matchAll(REMOTE_AI_CALL)];
  if (matches.length !== 1) {
    throw new Error(`expected exactly 1 Anthropic fetch call, found ${matches.length}`);
  }
  const match = matches[0];
  const start = match.index;

  const before = html.slice(Math.max(0, start - 40), start);
  if (!/await\s*$/.test(before)) throw new Error("Anthropic fetch is not directly awaited");

  const tryIndex = Math.max(html.lastIndexOf("try{", start), html.lastIndexOf("try {", start));
  const catchBetween = tryIndex >= 0 ? html.slice(tryIndex, start).search(/\}\s*catch\s*\(/) : 0;
  const catchAfter = html.slice(start).search(/\}\s*catch\s*\(/);
  if (tryIndex < 0 || catchBetween !== -1 || catchAfter < 0) {
    throw new Error("Anthropic fetch is not inside a try/catch");
  }

  const output = html.slice(0, start) + REMOTE_AI_REPLACEMENT + html.slice(start + match[0].length);
  if (output.includes("api.anthropic.com")) throw new Error("Anthropic host still referenced after transform");

  return {
    output,
    changes: [{ offset: start, removed: match[0], inserted: REMOTE_AI_REPLACEMENT }],
  };
}

// ---------------------------------------------------------------------------
// Validation helpers (shared by dry run)

const SCRIPT_BLOCK = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

/** Inline classic scripts only (skips src=, JSON and module/template types). */
export function inlineScripts(html) {
  const scripts = [];
  for (const m of html.matchAll(SCRIPT_BLOCK)) {
    const attrs = m[1];
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const type = attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i)?.[1]?.toLowerCase();
    if (type && !["text/javascript", "application/javascript", "module"].includes(type)) continue;
    scripts.push({ code: m[2], isModule: type === "module" });
  }
  return scripts;
}

/** Parse-only syntax check (nothing is executed). Returns error messages. */
export function scriptSyntaxErrors(html) {
  const errors = [];
  inlineScripts(html).forEach((script, index) => {
    if (script.isModule) return;
    try {
      new vm.Script(script.code, { filename: `inline-script-${index}.js` });
    } catch (error) {
      errors.push(`script #${index}: ${error.message}`);
    }
  });
  return errors;
}

/** Basic document-structure checks. Returns problem strings. */
export function structureProblems(html) {
  const problems = [];
  const lower = html.slice(0, 4096).toLowerCase();
  if (!lower.includes("<!doctype html")) problems.push("missing doctype");
  if (!/<html[\s>]/i.test(html)) problems.push("missing <html>");
  if (!/<head[\s>]/i.test(html)) problems.push("missing <head>");
  if (!/<body[\s>]/i.test(html)) problems.push("missing <body>");
  if (!/<\/html>\s*$/i.test(html.slice(-2048))) problems.push("missing closing </html>");
  if (!/<title[^>]*>[\s\S]*?<\/title>/i.test(html)) problems.push("missing <title>");
  const opens = (html.match(/<script\b/gi) || []).length;
  const closes = (html.match(/<\/script>/gi) || []).length;
  if (opens !== closes) problems.push(`script tag mismatch ${opens}/${closes}`);
  return problems;
}
