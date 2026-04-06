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

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as LessonGenerationRequestInput;

    const trimmedSourceUrl = payload.source_url?.trim() || "";
    const manualSourceText = payload.manual_source_text?.trim() || "";
    const normalizedTopic =
      payload.topic?.trim() ||
      (manualSourceText ? "Manual transcript lesson" : trimmedSourceUrl ? "YouTube lesson" : "");

    const normalizedInput: LessonGenerationInput = {
      ...payload,
      topic: normalizedTopic,
      source_url: trimmedSourceUrl || undefined,
      industry: payload.industry?.trim() || undefined,
      profession: payload.profession?.trim() || undefined,
    };

    const validation = validateLessonPayload(normalizedInput);

    if (!validation.ok) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          error_code: "invalid_payload",
          details: validation.errors,
        } satisfies LessonGenerationApiError,
        { status: 400 }
      );
    }

    let sourceText = manualSourceText || normalizedInput.topic;
    let sourceMeta: LessonGenerationApiResponse["source_meta"] = {
      source_kind: "manual",
      source_url: normalizedInput.source_url ?? null,
      video_id: null,
      transcript_language: null,
    };

    if (!manualSourceText && trimmedSourceUrl) {
      const parsedUrl = parseYouTubeVideoIdDetailed(trimmedSourceUrl);
      if (!parsedUrl.ok) {
        const details = [`${parsedUrl.code}: could not extract a valid YouTube video ID`];
        console.warn("YouTube URL parse failed", { sourceUrl: trimmedSourceUrl, details });
        return NextResponse.json(
          {
            error: "Only valid YouTube URLs are supported for transcript ingestion.",
            message: "Only valid YouTube URLs are supported for transcript ingestion.",
            error_code: "invalid_source_url",
            details,
          } satisfies LessonGenerationApiError,
          { status: 400 }
        );
      }
      const videoId = parsedUrl.videoId;

      const transcript = await fetchYouTubeTranscriptSource(trimmedSourceUrl);
      if (!transcript.ok) {
        const debugDetails = transcript.diagnostics.map(
          (item) => `${item.code}: ${item.message}`
        );

        console.warn("YouTube transcript ingestion failed", {
          videoId: transcript.videoId ?? videoId,
          reason: transcript.reason,
          diagnostics: debugDetails,
        });

        const status =
          transcript.reason === "invalid_url"
            ? 400
            : transcript.reason === "transcript_unavailable"
              ? 422
              : 502;

        return NextResponse.json(
          {
            error: transcript.message,
            message: transcript.message,
            error_code:
              transcript.reason === "invalid_url"
                ? "invalid_source_url"
                : transcript.reason,
            details:
              debugDetails.length > 0
                ? debugDetails
                : [
                    `reason: ${
                      transcript.reason === "invalid_url"
                        ? "invalid_source_url"
                        : transcript.reason
                    }`,
                  ],
          } satisfies LessonGenerationApiError,
          { status }
        );
      }

      sourceText = transcript.sourceText;
      sourceMeta = {
        source_kind: "youtube_transcript",
        source_url: trimmedSourceUrl,
        video_id: transcript.videoId,
        transcript_language: transcript.languageCode,
      };
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
      ...parsed.data,
      source_meta: sourceMeta,
    } satisfies LessonGenerationApiResponse);
  } catch (error) {
    console.error("[lesson/generate] Route failed", error);

    if (error instanceof Error && error.message === "OPENAI_API_KEY_MISSING") {
      return NextResponse.json(
        {
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
        error: "Failed to generate lesson.",
        error_code: "generation_failed",
        ...(process.env.NODE_ENV !== "production"
          ? { details: [`route_error: ${errorMessage}`] }
          : {}),
      } satisfies LessonGenerationApiError,
      { status: 500 }
    );
  }
}
