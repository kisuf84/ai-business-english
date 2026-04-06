import { NextResponse } from "next/server";
import { createSimulationSessionFeedback } from "../../../../lib/data/simulations";
import type { SimulationSessionFeedback } from "../../../../types/simulation";

type EndSimulationPayload = {
  simulation_id?: string;
  feedback?: SimulationSessionFeedback;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidSessionFeedback(value: unknown): value is SimulationSessionFeedback {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const overall = candidate.overall as Record<string, unknown> | undefined;
  const callouts = candidate.callouts;
  const hasValidOverall =
    !!overall &&
    isNonEmptyString(overall.sentenceStructure) &&
    isNonEmptyString(overall.grammar) &&
    isNonEmptyString(overall.vocabulary) &&
    isNonEmptyString(overall.fluency) &&
    isNonEmptyString(overall.relevance);
  const hasValidCallouts =
    Array.isArray(callouts) &&
    callouts.every((item) => {
      if (!item || typeof item !== "object") return false;
      const entry = item as Record<string, unknown>;
      return (
        isNonEmptyString(entry.response) &&
        isNonEmptyString(entry.worked) &&
        isNonEmptyString(entry.improve) &&
        isNonEmptyString(entry.reason)
      );
    });

  if (!hasValidOverall || !hasValidCallouts) return false;

  if (candidate.score_summary === undefined || candidate.score_summary === null) {
    return true;
  }
  return typeof candidate.score_summary === "string";
}

export async function POST(request: Request) {
  let payload: EndSimulationPayload;
  try {
    payload = (await request.json()) as EndSimulationPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isNonEmptyString(payload.simulation_id)) {
    return NextResponse.json({ error: "simulation_id is required" }, { status: 400 });
  }
  if (!isValidSessionFeedback(payload.feedback)) {
    return NextResponse.json({ error: "feedback is invalid" }, { status: 400 });
  }

  try {
    await createSimulationSessionFeedback({
      simulation_id: payload.simulation_id,
      feedback: payload.feedback,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Simulation end route failed:", error);
    return NextResponse.json(
      {
        error: "Failed to save simulation feedback.",
        ...(process.env.NODE_ENV !== "production"
          ? { details: error instanceof Error ? error.message : "unknown_end_error" }
          : {}),
      },
      { status: 500 }
    );
  }
}
