import { parseYouTubeVideoId } from "../youtube/url";

export type LessonSourceType = "youtube_url" | "generic_url" | "raw_text";

export type SourceDetectionResult = {
  type: LessonSourceType;
  value: string;
  normalizedUrl?: string;
};

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    try {
      const url = new URL(`https://${trimmed}`);
      return url.protocol === "http:" || url.protocol === "https:"
        ? url.toString()
        : null;
    } catch {
      return null;
    }
  }
}

export function detectLessonSource(input: string): SourceDetectionResult {
  const value = input.trim();
  const normalizedUrl = normalizeUrl(value);

  if (normalizedUrl && parseYouTubeVideoId(normalizedUrl)) {
    return { type: "youtube_url", value, normalizedUrl };
  }

  if (normalizedUrl) {
    return { type: "generic_url", value, normalizedUrl };
  }

  return { type: "raw_text", value };
}
