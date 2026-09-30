// Langslate Corporate/Academy lesson HTML lives in external object storage
// (Cloudflare R2), served directly from a dedicated content origin — never
// from the repo, a Next.js function or a same-origin rewrite (lesson HTML is
// externally authored and must not share the app origin's localStorage,
// where the Supabase session lives).
//
// Metadata stores only relative content keys, e.g.
//   "corporate/professions/pilot/pilot-module-02-cockpit-communication.html".
// The storage location is public configuration, not a credential:
//   LANGSLATE_CONTENT_BASE_URL=https://<content-host>/v1
// Moving from the staging bucket to the client's production bucket or a
// custom domain changes only that value. No filesystem access here, so this
// module is safe in server components, route handlers and client code alike
// (client code must pass the base URL in explicitly).

const CONTENT_KEY_PATTERN = /^[a-z0-9][a-z0-9/.-]*\.html$/;

export function isValidLangslateContentKey(contentKey: string): boolean {
  return (
    CONTENT_KEY_PATTERN.test(contentKey) &&
    !contentKey.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  );
}

/** Normalizes a configured base URL; null when missing or not absolute http(s). */
export function normalizeLangslateContentBaseUrl(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.search || url.hash) return null;
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

/** Pure URL builder: base + key, or null if either is unusable. */
export function buildLangslateContentUrl(
  contentKey: string,
  baseUrl: string | undefined | null
): string | null {
  const base = normalizeLangslateContentBaseUrl(baseUrl);
  if (!base || !isValidLangslateContentKey(contentKey)) return null;
  return `${base}/${contentKey}`;
}

/** Server-side: resolves against LANGSLATE_CONTENT_BASE_URL at request time. */
export function getLangslateContentUrl(contentKey: string): string | null {
  return buildLangslateContentUrl(contentKey, process.env.LANGSLATE_CONTENT_BASE_URL);
}
