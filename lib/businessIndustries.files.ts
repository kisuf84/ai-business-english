import { resolveCuratedFilePath } from "./contentLibraries";
import { listBusinessIndustriesItems } from "./businessIndustries";

const LIBRARY = "business-industries" as const;

/**
 * File-resolver companion to businessIndustries.ts, split out so that
 * app/api/search/route.ts (which only needs the pure metadata in
 * businessIndustries.ts) never transitively imports `fs`/`path` or
 * anything that touches content-library/business-industries. Vercel's
 * Node File Trace otherwise conservatively bundles that whole 61-file,
 * ~72MB directory into the search serverless function. Only
 * app/content/[library]/[slug]/route.ts should import this file.
 */
export async function getBusinessIndustriesFilePath(slug: string): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY, listBusinessIndustriesItems(), slug);
}
