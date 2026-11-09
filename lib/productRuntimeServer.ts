import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import corporateCatalog from "./generated/langslateCorporateCatalog.json";
import academyCatalog from "./generated/langslateAcademyCatalog.json";
import { buildLangslateContentUrl, normalizeLangslateContentBaseUrl } from "./langslateContent";
import {
  createAcademyLessonKeyMap,
  createCorporateLessonKeyMap,
  createLessonR2AdapterScript,
} from "./standaloneLessonMapping.mjs";
import { getProductRuntimeAccess } from "./productRuntimeAccess.mjs";
import { createSupabaseServerClient } from "./supabase/ssr";

const WORKSPACE_ROOT = path.join(process.cwd(), "private-product-workspaces");
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function response(message: string, status: number) {
  return new NextResponse(message, {
    status,
    headers: {
      "cache-control": "private, no-store, max-age=0",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

function createUrlMap(product: "corporate" | "academy", baseUrl: string) {
  const keyMap = product === "corporate"
    ? createCorporateLessonKeyMap(corporateCatalog)
    : createAcademyLessonKeyMap(academyCatalog);
  const urlMap: Record<string, { contentKey: string; url: string }> = Object.create(null);
  for (const [identity, contentKey] of Object.entries(keyMap)) {
    const contentUrl = buildLangslateContentUrl(contentKey, baseUrl);
    if (!contentUrl) throw new Error(`Invalid ${product} R2 content key in runtime catalog: ${identity}`);
    urlMap[identity] = { contentKey, url: contentUrl };
  }
  return urlMap;
}

function isAllowedAssetPath(segments: string[]) {
  if (segments.length === 1 && segments[0] === "index.html") return true;
  if (segments.length === 2 && segments[0] === "js" && ["app.js", "lessons.js", "r2-lesson-adapter.js"].includes(segments[1])) return true;
  return segments.length === 2 && segments[0] === "images" && Boolean(MIME_TYPES[path.extname(segments[1]).toLowerCase()]);
}

export async function serveProductRuntimeAsset(
  request: Request,
  product: "corporate" | "academy",
  assetPath: string[] | undefined,
) {
  const access = getProductRuntimeAccess(request.headers.get("host"), product, false);
  if (access === "wrong-host") return response("Not found.", 404);

  const supabase = await createSupabaseServerClient();
  if (!supabase) return response("Authentication is unavailable.", 503);
  const { data, error } = await supabase.auth.getUser();
  const authenticated = Boolean(data.user && !error);
  const verifiedAccess = getProductRuntimeAccess(request.headers.get("host"), product, authenticated);
  if (verifiedAccess !== "allow") return response("Authentication required.", 401);

  const segments = assetPath?.length ? assetPath : ["index.html"];
  if (
    segments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\") || segment.includes("\0")) ||
    !isAllowedAssetPath(segments)
  ) {
    return response("Not found.", 404);
  }

  if (segments.join("/") === "js/r2-lesson-adapter.js") {
    const baseUrl = normalizeLangslateContentBaseUrl(process.env.LANGSLATE_CONTENT_BASE_URL);
    if (!baseUrl) return response("Lesson content is not configured.", 503);
    try {
      const urlMap = createUrlMap(product, baseUrl);
      return new NextResponse(createLessonR2AdapterScript(product, urlMap), {
        status: 200,
        headers: {
          "content-type": MIME_TYPES[".js"],
          "cache-control": "private, no-store, max-age=0",
          "x-content-type-options": "nosniff",
          "x-robots-tag": "noindex, nofollow",
        },
      });
    } catch {
      return response("Could not build the lesson URL map.", 503);
    }
  }

  const root = path.join(WORKSPACE_ROOT, product);
  const filePath = path.resolve(root, ...segments);
  if (!filePath.startsWith(`${root}${path.sep}`)) return response("Not found.", 404);

  try {
    const contents = await fs.readFile(filePath);
    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()];
    if (!contentType) return response("Not found.", 404);
    return new NextResponse(contents, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "private, no-store, max-age=0",
        "x-content-type-options": "nosniff",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return response("Not found.", 404);
    return response("Could not load the workspace asset.", 500);
  }
}

export function isSupportedRuntimeProduct(value: string): value is "corporate" | "academy" {
  return value === "corporate" || value === "academy";
}
