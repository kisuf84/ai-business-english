const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export type YouTubeUrlParseErrorCode =
  | "invalid_url"
  | "unsupported_host"
  | "video_id_missing"
  | "video_id_invalid";

export type YouTubeUrlParseResult =
  | { ok: true; videoId: string }
  | { ok: false; code: YouTubeUrlParseErrorCode };

function normalizeUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

function cleanVideoId(value: string | null | undefined): string | null {
  if (!value) return null;
  const candidate = value.trim();
  return VIDEO_ID_REGEX.test(candidate) ? candidate : null;
}

export function parseYouTubeVideoId(rawUrl: string): string | null {
  const result = parseYouTubeVideoIdDetailed(rawUrl);
  return result.ok ? result.videoId : null;
}

export function parseYouTubeVideoIdDetailed(
  rawUrl: string
): YouTubeUrlParseResult {
  const url = normalizeUrl(rawUrl);
  if (!url) return { ok: false, code: "invalid_url" };

  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) {
    return { ok: false, code: "unsupported_host" };
  }

  let candidate: string | null = null;

  if (host.includes("youtu.be")) {
    candidate = cleanVideoId(url.pathname.split("/").filter(Boolean)[0]);
    if (candidate) {
      return { ok: true, videoId: candidate };
    }
    return { ok: false, code: "video_id_missing" };
  }

  const fromQuery = cleanVideoId(url.searchParams.get("v"));
  if (fromQuery) {
    return { ok: true, videoId: fromQuery };
  }

  const pathParts = url.pathname.split("/").filter(Boolean);
  if (pathParts.length === 0) {
    return { ok: false, code: "video_id_missing" };
  }

  const knownPrefixes = new Set(["embed", "shorts", "live", "v"]);
  if (knownPrefixes.has(pathParts[0])) {
    candidate = cleanVideoId(pathParts[1]);
    if (candidate) {
      return { ok: true, videoId: candidate };
    }
    return { ok: false, code: "video_id_missing" };
  }

  candidate = cleanVideoId(pathParts[0]);
  if (candidate) {
    return { ok: true, videoId: candidate };
  }

  if (pathParts[0]) {
    return { ok: false, code: "video_id_invalid" };
  }

  return { ok: false, code: "video_id_missing" };
}

export function isYouTubeUrl(rawUrl: string): boolean {
  return parseYouTubeVideoId(rawUrl) !== null;
}
