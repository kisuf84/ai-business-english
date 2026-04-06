import { NextResponse } from "next/server";
import { listSimulationSessions } from "../../../../lib/data/simulations";
import type { SimulationSessionFeedback } from "../../../../types/simulation";

function extractLessonLinks(text: string): string[] {
  const matches = text.match(/\/lessons\/[a-zA-Z0-9-]+/g) ?? [];
  return Array.from(new Set(matches));
}

function isSessionFeedback(value: unknown): value is SimulationSessionFeedback {
  if (!value || typeof value !== "object") return false;
  const feedback = value as Record<string, unknown>;
  const overall = feedback.overall as Record<string, unknown> | undefined;
  return (
    !!overall &&
    typeof overall.sentenceStructure === "string" &&
    typeof overall.grammar === "string" &&
    typeof overall.vocabulary === "string" &&
    typeof overall.fluency === "string" &&
    typeof overall.relevance === "string" &&
    Array.isArray(feedback.callouts)
  );
}

export async function GET() {
  try {
    const sessions = await listSimulationSessions(30);
    const payload = sessions.map((session) => {
      const feedbackAttempts = session.attempts.filter((attempt) => {
        const candidate = attempt.feedback_json as Record<string, unknown> | null;
        const meta = candidate?.meta as Record<string, unknown> | undefined;
        return meta?.kind === "session_feedback";
      });
      const latestFeedbackAttempt =
        feedbackAttempts.length > 0
          ? feedbackAttempts[feedbackAttempts.length - 1]
          : null;
      const latestSessionFeedback = latestFeedbackAttempt?.feedback_json
        ?.session_feedback;
      const sessionFeedback = isSessionFeedback(latestSessionFeedback)
        ? latestSessionFeedback
        : null;
      const transcriptAttempts = session.attempts.filter((attempt) => {
        const candidate = attempt.feedback_json as Record<string, unknown> | null;
        const meta = candidate?.meta as Record<string, unknown> | undefined;
        return meta?.kind !== "session_feedback";
      });
      const lessonLinks = Array.from(
        new Set(
          transcriptAttempts.flatMap((attempt) => [
            ...extractLessonLinks(attempt.user_input || ""),
            ...extractLessonLinks(attempt.ai_response || ""),
          ])
        )
      );

      return {
        simulation_id: session.simulation.id,
        scenario_type: session.simulation.scenario_type,
        level: session.simulation.level,
        industry: session.simulation.industry,
        profession: session.simulation.profession,
        created_at: session.simulation.created_at,
        message_count: transcriptAttempts.length * 2,
        attempts: transcriptAttempts.map((attempt) => ({
          id: attempt.id,
          user_input: attempt.user_input,
          ai_response: attempt.ai_response,
          created_at: attempt.created_at,
        })),
        lesson_links: lessonLinks,
        session_feedback: sessionFeedback,
        overall_feedback: sessionFeedback?.overall ?? null,
        targeted_callouts: sessionFeedback?.callouts ?? [],
        score_summary: sessionFeedback?.score_summary ?? null,
      };
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Simulation history route failed:", error);
    return NextResponse.json(
      {
        error: "Failed to load simulation history.",
        ...(process.env.NODE_ENV !== "production"
          ? { details: error instanceof Error ? error.message : "unknown_history_error" }
          : {}),
      },
      { status: 500 }
    );
  }
}
