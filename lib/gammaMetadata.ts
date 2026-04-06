const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const previewCache = new Map<string, { value: string | null; expiresAt: number }>();

function getAttr(tag: string, name: string): string | null {
  const regex = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  const match = tag.match(regex);
  return match?.[1] ?? null;
}

function extractMetaImages(
  html: string,
  sourceUrl: string
): { ogImage: string | null; twitterImage: string | null } {
  const metaTags = html.match(/<meta\s+[^>]*>/gi) ?? [];
  let ogImage: string | null = null;
  let twitterImage: string | null = null;

  for (const tag of metaTags) {
    const property = getAttr(tag, "property")?.toLowerCase();
    const name = getAttr(tag, "name")?.toLowerCase();
    const content = getAttr(tag, "content");
    if (!content) continue;

    try {
      const resolved = new URL(content, sourceUrl).toString();
      const key = property || name;
      if ((key === "og:image" || key === "og:image:url") && !ogImage) {
        ogImage = resolved;
      }
      if (key === "twitter:image" && !twitterImage) {
        twitterImage = resolved;
      }
    } catch {
      continue;
    }
  }

  return { ogImage, twitterImage };
}

function isUsablePreviewImage(url: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.includes("gamma-banner")) return false;
  if (lower.includes("/images/gamma-") && lower.includes("banner")) return false;
  return true;
}

export async function getGammaPreviewImage(
  url: string,
  options?: { debug?: boolean }
): Promise<string | null> {
  const now = Date.now();
  const cached = previewCache.get(url);
  if (cached && cached.expiresAt > now) {
    if (options?.debug && process.env.NODE_ENV !== "production") {
      console.info("[GammaPreview] cache_hit", {
        url,
        thumbnail: cached.value,
      });
    }
    return cached.value;
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TeacherResourcesBot/1.0)",
      },
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 21600 },
    });

    if (options?.debug && process.env.NODE_ENV !== "production") {
      console.info("[GammaPreview] fetch_status", {
        url,
        ok: response.ok,
        status: response.status,
      });
    }

    if (!response.ok) {
      previewCache.set(url, { value: null, expiresAt: now + CACHE_TTL_MS });
      return null;
    }

    const html = await response.text();
    const { ogImage, twitterImage } = extractMetaImages(html, url);
    const previewImage = ogImage || twitterImage;
    const usablePreviewImage = isUsablePreviewImage(previewImage)
      ? previewImage
      : null;

    if (options?.debug && process.env.NODE_ENV !== "production") {
      console.info("[GammaPreview] extraction_result", {
        url,
        foundOgImage: Boolean(ogImage),
        foundTwitterImage: Boolean(twitterImage),
        thumbnail: usablePreviewImage,
        discardedAsGeneric: Boolean(previewImage) && !usablePreviewImage,
      });
    }

    previewCache.set(url, { value: usablePreviewImage, expiresAt: now + CACHE_TTL_MS });
    return usablePreviewImage;
  } catch {
    if (options?.debug && process.env.NODE_ENV !== "production") {
      console.info("[GammaPreview] fetch_failed", {
        url,
      });
    }
    previewCache.set(url, { value: null, expiresAt: now + CACHE_TTL_MS });
    return null;
  }
}
