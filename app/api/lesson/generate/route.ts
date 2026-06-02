import { NextResponse } from "next/server";
import type {
  LessonGenerationApiError,
  LessonGenerationApiResponse,
  LessonGenerationInput,
  LessonGenerationRequestInput,
} from "../../../../types/lesson";
import {
  normalizeLessonOutput,
  validateLessonPayload,
} from "../../../../lib/validators/lesson";
import { fetchYouTubeTranscriptSource } from "../../../../lib/youtube/transcript";
import {
  buildLessonPrompt,
  buildLessonRepairPrompt,
  generateLesson,
  isLessonGenerationMaxTokenError,
  isLessonGenerationTimeoutError,
  parseLessonJson,
  parseAndValidateLessonOutput,
  repairLesson,
} from "../../../../lib/ai/lesson";
import { parseYouTubeVideoIdDetailed } from "../../../../lib/youtube/url";

type SourceExtractionResult =
  | {
      ok: true;
      sourceText: string;
      sourceMeta: LessonGenerationApiResponse["source_meta"];
      sourceTopicHint?: string;
    }
  | {
      ok: false;
      status: number;
      payload: LessonGenerationApiError;
    };

const GENERATION_TIMEOUT_MESSAGE =
  "Lesson generation took longer than expected. Please try again.";

function estimateLessonSize(value: unknown) {
  const serialized = JSON.stringify(value ?? {});
  return {
    characters: serialized.length,
    estimatedTokens: Math.ceil(serialized.length / 4),
  };
}

function isIncompleteJsonError(error: string) {
  return error === "Model output is not valid JSON.";
}

function parseHtmlToText(html: string): string {
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
  const section = articleMatch ? articleMatch[0] : html;

  return section
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function fetchArticleText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LessonGenerator/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`article_fetch_failed_${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("text/html")) {
      throw new Error("article_not_html");
    }

    const html = await response.text();
    const text = parseHtmlToText(html);
    if (text.length < 600) {
      throw new Error("article_too_short");
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

async function extractSource(params: {
  sourceUrl: string;
  rawSourceText: string;
  fallbackTopic: string;
}): Promise<SourceExtractionResult> {
  const { sourceUrl, rawSourceText, fallbackTopic } = params;

  if (rawSourceText) {
    return {
      ok: true,
      sourceText: rawSourceText,
      sourceTopicHint: fallbackTopic || "Custom source lesson",
      sourceMeta: {
        source_kind: "raw_text",
        source_url: sourceUrl || null,
        video_id: null,
        transcript_language: null,
      },
    };
  }

  if (!sourceUrl) {
    return {
      ok: true,
      sourceText: fallbackTopic,
      sourceMeta: {
        source_kind: "manual",
        source_url: null,
        video_id: null,
        transcript_language: null,
      },
    };
  }

  const parsedUrl = (() => {
    try {
      return new URL(sourceUrl);
    } catch {
      return null;
    }
  })();

  if (!parsedUrl) {
    return {
      ok: false,
      status: 400,
      payload: {
        error: "The source URL is invalid. Please provide a full URL.",
        error_code: "invalid_source_url",
        details: ["url_parse_failed"],
      },
    };
  }

  const isYouTubeHost =
    parsedUrl.hostname.includes("youtube.com") ||
    parsedUrl.hostname.includes("youtu.be");

  if (isYouTubeHost) {
    const parsedVideo = parseYouTubeVideoIdDetailed(sourceUrl);
    if (!parsedVideo.ok) {
      return {
        ok: false,
        status: 400,
        payload: {
          error: "That YouTube URL is invalid. Please check the link and try again.",
          error_code: "invalid_source_url",
          details: [parsedVideo.code],
        },
      };
    }

    const transcript = await fetchYouTubeTranscriptSource(sourceUrl);
    if (!transcript.ok) {
      const debugDetails = transcript.diagnostics.map(
        (item) => `${item.code}: ${item.message}`
      );
      const isTranscriptUnavailable =
        transcript.reason === "no_captions" ||
        transcript.reason === "captions_disabled" ||
        transcript.reason === "unsupported_video";
      const status =
        transcript.reason === "invalid_url"
          ? 400
          : isTranscriptUnavailable
            ? 422
          : 502;

      return {
        ok: false,
        status,
        payload: {
          error:
            isTranscriptUnavailable
              ? "Transcript unavailable for this video. Paste source text to continue."
              : transcript.message,
          message: transcript.message,
          error_code:
            transcript.reason === "invalid_url"
              ? "invalid_source_url"
              : transcript.reason,
          details:
            debugDetails.length > 0
              ? debugDetails
              : [transcript.reason || "transcript_fetch_failed"],
        },
      };
    }

    return {
      ok: true,
      sourceText: transcript.sourceText,
      sourceMeta: {
        source_kind: "youtube_transcript",
        source_url: sourceUrl,
        video_id: transcript.videoId,
        transcript_language: transcript.languageCode,
      },
    };
  }

  try {
    const articleText = await fetchArticleText(sourceUrl);
    return {
      ok: true,
      sourceText: articleText,
      sourceMeta: {
        source_kind: "article_text",
        source_url: sourceUrl,
        video_id: null,
        transcript_language: null,
      },
      sourceTopicHint: parsedUrl.hostname.replace(/^www\./, ""),
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "article_extract_failed";
    return {
      ok: false,
      status: 422,
      payload: {
        error:
          "We could not extract content from this article URL. Try another URL or paste raw text.",
        error_code: "unsupported_source",
        details: [reason],
      },
    };
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as LessonGenerationRequestInput;

    const sourceUrl = payload.source_url?.trim() || "";
    const rawSourceText =
      payload.source_text?.trim() || payload.manual_source_text?.trim() || "";
    const normalizedTopic = payload.topic?.trim() || "";

    const normalizedInput: LessonGenerationInput = {
      ...payload,
      topic:
        normalizedTopic ||
        (rawSourceText ? "Source text lesson" : sourceUrl ? "Source lesson" : ""),
      source_url: sourceUrl || undefined,
      source_text: rawSourceText || undefined,
      industry: payload.industry?.trim() || undefined,
      profession: payload.profession?.trim() || undefined,
    };

    console.info("[lesson-generate] request_received", {
      inputType: sourceUrl
        ? sourceUrl.includes("youtube.com") || sourceUrl.includes("youtu.be")
          ? "youtube_url"
          : "source_url"
        : rawSourceText
          ? "source_text"
          : "topic",
      hasTopic: Boolean(normalizedTopic),
      hasSourceUrl: Boolean(sourceUrl),
      hasSourceText: Boolean(rawSourceText),
      level: normalizedInput.level || null,
      lessonTypeProvided: Boolean(normalizedInput.lesson_type?.trim()),
    });

    const validation = validateLessonPayload(normalizedInput);
    if (!validation.ok) {
      console.warn("[lesson-generate] invalid_payload", {
        errors: validation.errors,
      });
      return NextResponse.json(
        {
          error: "Please complete the required lesson fields.",
          error_code: "invalid_payload",
          details: validation.errors,
        } satisfies LessonGenerationApiError,
        { status: 400 }
      );
    }

    if (!sourceUrl && !rawSourceText && !normalizedTopic) {
      return NextResponse.json(
        {
          error:
            "Add a topic, a source URL, or raw source text before generating your lesson.",
          error_code: "empty_source_input",
          details: ["topic/source_url/source_text/manual_source_text is empty"],
        } satisfies LessonGenerationApiError,
        { status: 400 }
      );
    }

    const extracted = await extractSource({
      sourceUrl,
      rawSourceText,
      fallbackTopic: normalizedTopic,
    });

    if (!extracted.ok) {
      console.warn("[lesson-generate] source_extraction_failed", {
        status: extracted.status,
        errorCode: extracted.payload.error_code,
        details: extracted.payload.details ?? [],
      });
      return NextResponse.json(extracted.payload, { status: extracted.status });
    }

    if (!normalizedInput.topic && extracted.sourceTopicHint) {
      normalizedInput.topic = extracted.sourceTopicHint;
    }

    console.info("[lesson-generate] source_ready", {
      sourceKind: extracted.sourceMeta?.source_kind ?? "manual",
      sourceTextLength: extracted.sourceText.length,
      videoId: extracted.sourceMeta?.video_id ?? null,
    });

    const prompt = buildLessonPrompt({
      input: normalizedInput,
      sourceText: extracted.sourceText,
      sourceKind: extracted.sourceMeta?.source_kind ?? "manual",
      videoId: extracted.sourceMeta?.video_id ?? null,
    });

    let rawOutput = "";
    try {
      const generated = await generateLesson(prompt);
      rawOutput = generated.text;
      console.info("[lesson-generate] openai_response", {
        durationMs: generated.durationMs,
        responseLength: rawOutput.length,
        estimatedLessonSize: {
          characters: rawOutput.length,
          estimatedTokens: generated.estimatedOutputTokens,
        },
        finishReasons: generated.finishReasons,
        usage: generated.usage,
      });
    } catch (error) {
      console.error("[lesson-generate] openai_failed", {
        message: error instanceof Error ? error.message : "unknown_openai_error",
        timeout: isLessonGenerationTimeoutError(error),
        maxTokenExhaustion: isLessonGenerationMaxTokenError(error),
      });
      if (
        isLessonGenerationTimeoutError(error) ||
        isLessonGenerationMaxTokenError(error)
      ) {
        return NextResponse.json(
          {
            error: GENERATION_TIMEOUT_MESSAGE,
            error_code: "generation_failed",
            ...(process.env.NODE_ENV !== "production"
              ? {
                  details: [
                    isLessonGenerationMaxTokenError(error)
                      ? "openai_finish_reason_length"
                      : "openai_timeout",
                  ],
                }
              : {}),
          } satisfies LessonGenerationApiError,
          { status: 504 }
        );
      }
      throw error;
    }

    const parsed = parseAndValidateLessonOutput(rawOutput);
    if (!parsed.ok && isIncompleteJsonError(parsed.error)) {
      console.error("[lesson-generate] incomplete_json", {
        estimatedLessonSize: {
          characters: rawOutput.length,
          estimatedTokens: Math.ceil(rawOutput.length / 4),
        },
        error: parsed.error,
      });
    }
    let normalized =
      parsed.ok
        ? normalizeLessonOutput(parsed.data, { strict: true })
        : {
            ok: false as const,
            errors: [parsed.error],
          };

    if (!normalized.ok) {
      const brokenLesson = parseLessonJson(rawOutput) ?? {};
      const repairPrompt = buildLessonRepairPrompt({
        input: normalizedInput,
        sourceText: extracted.sourceText,
        sourceKind: extracted.sourceMeta?.source_kind ?? "manual",
        videoId: extracted.sourceMeta?.video_id ?? null,
        brokenLesson,
        validationErrors: normalized.errors,
      });

      let repairedRaw: Awaited<ReturnType<typeof repairLesson>>;
      try {
        repairedRaw = await repairLesson(repairPrompt);
      } catch (error) {
        console.error("[lesson-generate] repair_failed", {
          message: error instanceof Error ? error.message : "unknown_repair_error",
          timeout: isLessonGenerationTimeoutError(error),
          maxTokenExhaustion: isLessonGenerationMaxTokenError(error),
        });
        if (
          isLessonGenerationTimeoutError(error) ||
          isLessonGenerationMaxTokenError(error)
        ) {
          return NextResponse.json(
            {
              error: GENERATION_TIMEOUT_MESSAGE,
              error_code: "generation_failed",
              ...(process.env.NODE_ENV !== "production"
                ? {
                    details: [
                      isLessonGenerationMaxTokenError(error)
                        ? "repair_openai_finish_reason_length"
                        : "repair_openai_timeout",
                    ],
                  }
                : {}),
            } satisfies LessonGenerationApiError,
            { status: 504 }
          );
        }
        throw error;
      }
      console.info("[lesson-generate] repair_response", {
        durationMs: repairedRaw.durationMs,
        responseLength: repairedRaw.text.length,
        estimatedLessonSize: {
          characters: repairedRaw.text.length,
          estimatedTokens: repairedRaw.estimatedOutputTokens,
        },
        finishReasons: repairedRaw.finishReasons,
        usage: repairedRaw.usage,
      });
      const repairedParsed = parseAndValidateLessonOutput(repairedRaw.text);
      normalized = repairedParsed.ok
        ? normalizeLessonOutput(repairedParsed.data, { strict: true })
        : {
            ok: false as const,
            errors: [
              ...normalized.errors,
              `repair_pass_failed: ${repairedParsed.error}`,
            ],
          };
    }

    if (!normalized.ok) {
      console.error("[lesson/generate] Lesson failed strict validation after repair", {
        errors: normalized.errors,
      });
      console.error("[lesson-generate] validation_failed", {
        errors: normalized.errors,
        estimatedLessonSize: estimateLessonSize(parseLessonJson(rawOutput) ?? rawOutput),
        incompleteJson: normalized.errors.some(isIncompleteJsonError),
      });
      return NextResponse.json(
        {
          error: normalized.errors.some(isIncompleteJsonError)
            ? GENERATION_TIMEOUT_MESSAGE
            : "Lesson generation failed quality checks. Please retry with clearer source content.",
          error_code: "generation_failed",
          ...(process.env.NODE_ENV !== "production"
            ? { details: normalized.errors }
            : {}),
        } satisfies LessonGenerationApiError,
        { status: 500 }
      );
    }

    console.info("[lesson-generate] success", {
      title: normalized.data.title,
      sourceKind: extracted.sourceMeta?.source_kind ?? "manual",
      validation: "success",
      estimatedLessonSize: estimateLessonSize(normalized.data),
    });

    return NextResponse.json({
      ...normalized.data,
      source_meta: extracted.sourceMeta,
    } satisfies LessonGenerationApiResponse);
  } catch (error) {
    console.error("[lesson/generate] Route failed", error);
    console.error("[lesson-generate] route_failed", {
      message: error instanceof Error ? error.message : "unknown_generation_error",
    });

    if (error instanceof Error && error.message === "OPENAI_API_KEY_MISSING") {
      return NextResponse.json(
        {
          error: "Lesson generation is unavailable right now. Please try again later.",
          error_code: "generation_failed",
          ...(process.env.NODE_ENV !== "production"
            ? { details: ["OPENAI_API_KEY is missing in server environment"] }
            : {}),
        } satisfies LessonGenerationApiError,
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Unexpected server issue while generating this lesson. Please retry.",
        error_code: "generation_failed",
        ...(process.env.NODE_ENV !== "production"
          ? {
              details: [
                error instanceof Error ? error.message : "unknown_generation_error",
              ],
            }
          : {}),
      } satisfies LessonGenerationApiError,
      { status: 500 }
    );
  }
}
