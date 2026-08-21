/**
 * Shared text normalization for full-text content search. Used by both the
 * offline search-index generator (scripts/buildSyntaxFlowSearchIndex.mjs)
 * and the runtime search route, so indexed text and incoming queries are
 * folded identically — that symmetry is what makes "Él desarrolló" and
 * "el desarrollo" match the same underlying text.
 *
 * Deliberately just case + diacritic + punctuation/whitespace folding — no
 * stemming/lemmatization (see search-architecture investigation).
 *
 * Plain JS (not .ts) on purpose: the offline generator runs via plain
 * `node scripts/buildSyntaxFlowSearchIndex.mjs`, and a .js import here
 * resolves natively for both that script and the Next.js app (allowJs)
 * without needing any tsconfig workaround for executing TypeScript directly.
 */
const COMBINING_DIACRITICS_START = 0x0300;
const COMBINING_DIACRITICS_END = 0x036f;
const NON_WORD = /[^\p{L}\p{N}\s]/gu;
const WHITESPACE = /\s+/g;

function stripCombiningDiacritics(input) {
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= COMBINING_DIACRITICS_START && code <= COMBINING_DIACRITICS_END) {
      continue;
    }
    out += ch;
  }
  return out;
}

export function normalizeSearchText(input) {
  const decomposed = input.normalize("NFD");
  const stripped = stripCombiningDiacritics(decomposed);
  return stripped
    .toLowerCase()
    .replace(NON_WORD, " ")
    .replace(WHITESPACE, " ")
    .trim();
}
