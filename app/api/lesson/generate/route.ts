import { NextResponse } from "next/server";
import type {
  LessonGenerationApiError,
  LessonGenerationApiResponse,
  LessonGenerationInput,
  LessonGenerationRequestInput,
} from "../../../../types/lesson";
import { validateLessonPayload } from "../../../../lib/validators/lesson";
import { fetchYouTubeTranscriptSource } from "../../../../lib/youtube/transcript";
import { buildLessonPrompt, generateLesson, parseAndValidateLessonOutput } from "../../../../lib/ai/lesson";
import { parseYouTubeVideoIdDetailed } from "../../../../lib/youtube/url";
import { detectLessonSource } from "../../../../lib/content/sourceDetection";
import { extractWebpageText } from "../../../../lib/content/extractWebpageText";

const REQUIRED_FIELDS_ERROR = "Please complete all required fields";
const PROCESSING_ERROR = "We couldn’t process your request. Try again.";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as LessonGenerationRequestInput;

    const trimmedSourceUrl = payload.source_url?.trim() || "";
    const providedSourceText =
      payload.source_text?.trim() || payload.manual_source_text?.trim() || "";
    const transcriptAttempt = Math.max(1, Number(payload.transcript_attempt) || 1);
    const sourceDetection = trimmedSourceUrl
      ? detectLessonSource(trimmedSourceUrl)
      : providedSourceText
        ? detectLessonSource(providedSourceText)
        : null;
    const normalizedTopic =
      payload.topic?.trim() ||
      (providedSourceText
        ? "Source text lesson"
        : trimmedSourceUrl
          ? sourceDetection?.type === "youtube_url"
            ? "YouTube lesson"
            : "Article lesson"
          : "");
    const normalizedSourceUrl =
      sourceDetection?.type === "youtube_url" || sourceDetection?.type === "generic_url"
        ? sourceDetection.normalizedUrl || trimmedSourceUrl
        : "";

    const normalizedInput: LessonGenerationInput = {
      ...payload,
      topic: normalizedTopic,
      source_url: normalizedSourceUrl || undefined,
      source_text: providedSourceText || undefined,
      industry: payload.industry?.trim() || undefined,
      profession: payload.profession?.trim() || undefined,
    };

    const validation = validateLessonPayload(normalizedInput);

    if (!validation.ok) {
      return NextResponse.json(
        {
          status: "failed",
          error: REQUIRED_FIELDS_ERROR,
          error_code: "invalid_payload",
          details: validation.errors,
        } satisfies LessonGenerationApiError,
        { status: 400 }
      );
    }

    let sourceText = providedSourceText || normalizedInput.topic;
    let sourceMeta: LessonGenerationApiResponse["source_meta"] = {
      source_kind: providedSourceText ? "raw_text" : "manual",
      source_url: normalizedInput.source_url ?? null,
      video_id: null,
      transcript_language: null,
    };

    if (!providedSourceText && normalizedSourceUrl) {
      if (sourceDetection?.type === "generic_url") {
        const extracted = await extractWebpageText(normalizedSourceUrl);

        if (!extracted.ok) {
          return NextResponse.json(
            {
              status: "failed",
              error: extracted.message,
              message: extracted.message,
              error_code: "source_extraction_failed",
              ...(process.env.NODE_ENV !== "production"
                ? { details: [`reason: ${extracted.reason}`] }
                : {}),
            } satisfies LessonGenerationApiError,
            { status: 422 }
          );
        }

        sourceText = extracted.sourceText;
        sourceMeta = {
          source_kind: "webpage",
          source_url: normalizedSourceUrl,
          video_id: null,
          transcript_language: null,
          title: extracted.title ?? null,
        };
      } else {
        const parsedUrl = parseYouTubeVideoIdDetailed(normalizedSourceUrl);
        if (!parsedUrl.ok) {
          const details = [`${parsedUrl.code}: could not extract a valid YouTube video ID`];
          console.warn("YouTube URL parse failed", { sourceUrl: normalizedSourceUrl, details });
          return NextResponse.json(
            {
              status: "failed",
              error: "Please enter a valid YouTube URL.",
              message: "Please enter a valid YouTube URL.",
              error_code: "invalid_source_url",
              details,
            } satisfies LessonGenerationApiError,
            { status: 400 }
          );
        }
        const videoId = parsedUrl.videoId;

        const transcript = await fetchYouTubeTranscriptSource(normalizedSourceUrl);
        if (!transcript.ok) {
          const debugDetails = transcript.diagnostics.map(
            (item) => `${item.code}: ${item.message}`
          );

          console.warn("YouTube transcript ingestion failed", {
            videoId: transcript.videoId ?? videoId,
            reason: transcript.reason,
            transcriptAttempt,
            diagnostics: debugDetails,
          });

          if (transcript.reason !== "invalid_url" && transcriptAttempt < 2) {
            return NextResponse.json(
              {
                status: "still_processing",
                reason: "retrying",
                error: "Still processing.",
                message: "Still processing.",
                error_code: transcript.reason,
                ...(process.env.NODE_ENV !== "production"
                  ? {
                      details:
                        debugDetails.length > 0
                          ? debugDetails
                          : [`reason: ${transcript.reason}`],
                    }
                  : {}),
              } satisfies LessonGenerationApiError,
              { status: 202 }
            );
          }

          const status =
            transcript.reason === "invalid_url"
              ? 400
              : transcript.reason === "transcript_fetch_failed" ||
                  transcript.reason === "unknown_error"
                ? 502
                : 422;

          return NextResponse.json(
            {
              status: "needs_transcript",
              error: transcript.message,
              message: transcript.message,
              error_code: transcript.reason,
              ...(process.env.NODE_ENV !== "production"
                ? {
                    details:
                      debugDetails.length > 0
                        ? debugDetails
                        : [`reason: ${transcript.reason}`],
                  }
                : {}),
            } satisfies LessonGenerationApiError,
            { status }
          );
        }

        sourceText = transcript.sourceText;
        sourceMeta = {
          source_kind: "youtube_transcript",
          source_url: normalizedSourceUrl,
          video_id: transcript.videoId,
          transcript_language: transcript.languageCode,
        };
      }
    }

    const prompt = buildLessonPrompt({
      input: normalizedInput,
      sourceText,
      sourceKind: sourceMeta?.source_kind ?? "manual",
      videoId: sourceMeta?.video_id ?? null,
    });

    const rawOutput = await generateLesson(prompt);
    const parsed = parseAndValidateLessonOutput(rawOutput);

    if (!parsed.ok) {
      console.error("[lesson/generate] Parsed lesson output failed validation", {
        reason: parsed.error,
      });
      return NextResponse.json(
        {
          status: "failed",
          error: parsed.error,
          error_code: "generation_failed",
          ...(process.env.NODE_ENV !== "production"
            ? { details: [`validation: ${parsed.error}`] }
            : {}),
        } satisfies LessonGenerationApiError,
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "ready",
      ...parsed.data,
      source_meta: sourceMeta,
    } satisfies LessonGenerationApiResponse);
  } catch (error) {
    console.error("[lesson/generate] Route failed", error);

    if (error instanceof Error && error.message === "OPENAI_API_KEY_MISSING") {
      return NextResponse.json(
        {
          status: "failed",
          error: "Lesson generation is unavailable: OPENAI_API_KEY is not configured.",
          error_code: "generation_failed",
          ...(process.env.NODE_ENV !== "production"
            ? { details: ["OPENAI_API_KEY is missing in server environment"] }
            : {}),
        } satisfies LessonGenerationApiError,
        { status: 503 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "unknown_error";
    return NextResponse.json(
      {
        status: "failed",
        error: PROCESSING_ERROR,
        error_code: "generation_failed",
        ...(process.env.NODE_ENV !== "production"
          ? { details: [`route_error: ${errorMessage}`] }
          : {}),
      } satisfies LessonGenerationApiError,
      { status: 500 }
    );
  }
}
