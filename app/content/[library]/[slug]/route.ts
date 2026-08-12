import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import type { ContentLibraryId } from "../../../../lib/contentLibraries";

type ContentRouteProps = {
  params: {
    library: string;
    slug: string;
  };
};

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "private, no-store, max-age=0",
  "x-robots-tag": "noindex, nofollow",
} as const;

type LibraryResolver = (slug: string) => Promise<string | null>;

/**
 * One generic raw-HTML passthrough route for every August-expansion content
 * library, instead of duplicating app/english-training-content/[lesson]/
 * route.ts's shape 8 times. Populated per-section in Phase B — each entry
 * calls that section's own curated resolveCuratedFilePath(...) wrapper, so
 * this route never does a raw filesystem join from the URL params itself.
 *
 * Deliberately does NOT touch English Training's existing, already-working
 * app/english-training-content/[lesson]/route.ts.
 */
const RESOLVERS: Partial<Record<ContentLibraryId, LibraryResolver>> = {};

export async function GET(_: Request, { params }: ContentRouteProps) {
  const resolver = RESOLVERS[params.library as ContentLibraryId];
  if (!resolver) {
    return new NextResponse("Not found.", { status: 404 });
  }

  const filePath = await resolver(params.slug);
  if (!filePath) {
    return new NextResponse("Not found.", { status: 404 });
  }

  const html = await fs.readFile(filePath, "utf-8");

  return new NextResponse(html, {
    status: 200,
    headers: HTML_HEADERS,
  });
}
