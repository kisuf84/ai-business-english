import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/ssr";
import type { ContentLibraryId } from "../../../../lib/contentLibraries";
import { getSituationalEnglishFilePath } from "../../../../lib/situationalEnglish.files";
import { getListeningTrainingFilePath } from "../../../../lib/listeningTraining.files";
import { getReadingTrainingFilePath } from "../../../../lib/readingTraining.files";
import { getBilingualCompendiumFilePath } from "../../../../lib/bilingualCompendium.files";
import { getLexiproFilePath } from "../../../../lib/lexipro.files";
import { getLexicaFilePath } from "../../../../lib/lexica.files";
import { getBizCompendiumFilePath } from "../../../../lib/bizCompendium.files";
import { getGossipEnglishFilePath } from "../../../../lib/gossipEnglish.files";
import { getBusinessIndustriesFilePath } from "../../../../lib/businessIndustries.files";
import { getSyntaxFlowFilePath } from "../../../../lib/syntaxFlow.files";
import { getLevelTestFilePath } from "../../../../lib/levelTest.files";
import { getListeningHubFilePath } from "../../../../lib/listeningHub.files";
import { getSpeakingTopicsFilePath } from "../../../../lib/speakingTopics.files";
import { getLangslate365FilePath } from "../../../../lib/langslate365.files";
import { getLangslateFlowFilePath } from "../../../../lib/langslateFlow.files";
import {
  getProductContentDocumentAccess,
  getProtectedProductContentDocument,
  injectProduct365LandingActions,
  injectProductSignOutControl,
} from "../../../../lib/productContentSecurity.mjs";

type ContentRouteProps = {
  params: Promise<{
    library: string;
    slug: string;
  }>;
};

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "private, no-store, max-age=0",
  "x-robots-tag": "noindex, nofollow",
} as const;

const IMAGE_OPTIMIZED_ROOT = path.join(process.cwd(), "generated-content", "image-optimized");

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
const RESOLVERS: Partial<Record<ContentLibraryId, LibraryResolver>> = {
  "situational-english": getSituationalEnglishFilePath,
  "listening-training": getListeningTrainingFilePath,
  "reading-training": getReadingTrainingFilePath,
  "bilingual-compendium": getBilingualCompendiumFilePath,
  lexipro: getLexiproFilePath,
  lexica: getLexicaFilePath,
  "biz-compendium": getBizCompendiumFilePath,
  "gossip-english": getGossipEnglishFilePath,
  "business-industries": getBusinessIndustriesFilePath,
  "syntax-flow-espanol": (slug) => getSyntaxFlowFilePath("espanol", slug),
  "syntax-flow-francais": (slug) => getSyntaxFlowFilePath("francais", slug),
  "syntax-flow-portugues": (slug) => getSyntaxFlowFilePath("portugues", slug),
  "level-test": getLevelTestFilePath,
  "listening-hub": getListeningHubFilePath,
  "speaking-topics": getSpeakingTopicsFilePath,
  "langslate-365": getLangslate365FilePath,
  "langslate-flow": getLangslateFlowFilePath,
};

function supportsImageOptimizedHtml(library: string): boolean {
  return library.startsWith("syntax-flow-") || library === "gossip-english";
}

async function readImageOptimizedHtml(library: string, slug: string): Promise<string | null> {
  if (!supportsImageOptimizedHtml(library)) return null;

  const filePath = path.join(IMAGE_OPTIMIZED_ROOT, library, `${slug}.html`);

  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function GET(request: Request, { params }: ContentRouteProps) {
  const { library, slug } = await params;
  const resolver = RESOLVERS[library as ContentLibraryId];
  if (!resolver) {
    return new NextResponse("Not found.", { status: 404 });
  }

  const protectedProduct = getProtectedProductContentDocument(library, slug);
  if (protectedProduct) {
    const initialAccess = getProductContentDocumentAccess(
      request.headers.get("host"),
      protectedProduct,
      false,
    );
    if (initialAccess === "wrong-host") return new NextResponse("Not found.", { status: 404 });

    const supabase = await createSupabaseServerClient();
    if (!supabase) return new NextResponse("Authentication is unavailable.", { status: 503 });
    const { data, error } = await supabase.auth.getUser();
    const access = getProductContentDocumentAccess(
      request.headers.get("host"),
      protectedProduct,
      Boolean(data.user && !error),
    );
    if (access === "wrong-host") return new NextResponse("Not found.", { status: 404 });
    if (access !== "allow") return new NextResponse("Authentication required.", { status: 401 });
  }

  const filePath = await resolver(slug);
  if (!filePath) {
    return new NextResponse("Not found.", { status: 404 });
  }

  const sourceHtml = (await readImageOptimizedHtml(library, slug)) ?? (await fs.readFile(filePath, "utf-8"));
  const html = protectedProduct
    ? injectProductSignOutControl(sourceHtml, protectedProduct)
    : library === "langslate-365" && slug === "landing"
      ? injectProduct365LandingActions(sourceHtml)
      : sourceHtml;

  return new NextResponse(html, {
    status: 200,
    headers: HTML_HEADERS,
  });
}
