type WebpageExtractionSuccess = {
  ok: true;
  sourceText: string;
  title?: string | null;
};

type WebpageExtractionFailure = {
  ok: false;
  reason: "invalid_url" | "fetch_failed" | "unsupported_content" | "empty_content";
  message: string;
};

export type WebpageExtractionResult =
  | WebpageExtractionSuccess
  | WebpageExtractionFailure;

const MIN_READABLE_CHARS = 250;
const MAX_SOURCE_CHARS = 24000;

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    gt: ">",
    lt: "<",
    quot: "\"",
    apos: "'",
    nbsp: " ",
    ndash: "-",
    mdash: "-",
    rsquo: "'",
    lsquo: "'",
    rdquo: "\"",
    ldquo: "\"",
  };

  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    const key = String(entity);
    if (key[0] === "#") {
      const isHex = key[1]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(key.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }
    return named[key] ?? match;
  });
}

function normalizeWhitespace(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/\r/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

function stripTags(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|main|h[1-6]|li|blockquote)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ");
}

function stripBoilerplate(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(nav|header|footer|aside|form)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");
}

function extractTagContent(html: string, tagName: string): string | null {
  const match = html.match(
    new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i")
  );
  return match?.[1] ?? null;
}

function extractTitle(html: string): string | null {
  const rawTitle = extractTagContent(html, "title");
  if (!rawTitle) return null;
  const title = normalizeWhitespace(stripTags(rawTitle));
  return title || null;
}

function extractReadableHtml(html: string): string {
  const cleaned = stripBoilerplate(html);
  const article = extractTagContent(cleaned, "article");
  if (article) return article;

  const main = extractTagContent(cleaned, "main");
  if (main) return main;

  const body = extractTagContent(cleaned, "body");
  return body || cleaned;
}

export async function extractWebpageText(
  rawUrl: string
): Promise<WebpageExtractionResult> {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    return {
      ok: false,
      reason: "invalid_url",
      message: "Please enter a valid article or webpage URL.",
    };
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (compatible; AI Business English Lesson Generator)",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: "fetch_failed",
        message:
          "We could not read that page. Try pasting the article text directly.",
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/xhtml")
    ) {
      return {
        ok: false,
        reason: "unsupported_content",
        message:
          "That link does not look like a readable article page. Try pasting the text directly.",
      };
    }

    const raw = await response.text();
    const title = contentType.includes("text/plain") ? null : extractTitle(raw);
    const readableHtml = contentType.includes("text/plain")
      ? raw
      : extractReadableHtml(raw);
    const sourceText = normalizeWhitespace(stripTags(readableHtml)).slice(
      0,
      MAX_SOURCE_CHARS
    );

    if (sourceText.length < MIN_READABLE_CHARS) {
      return {
        ok: false,
        reason: "empty_content",
        message:
          "We could not extract enough readable text from that page. Try pasting the article text directly.",
      };
    }

    return {
      ok: true,
      sourceText,
      title,
    };
  } catch {
    return {
      ok: false,
      reason: "fetch_failed",
      message:
        "We could not read that page. Try pasting the article text directly.",
    };
  }
}
