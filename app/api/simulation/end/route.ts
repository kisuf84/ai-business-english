import { NextResponse } from "next/server";
import { createSimulationSessionFeedback } from "../../../../lib/data/simulations";
import type { SimulationSessionFeedback } from "../../../../types/simulation";

type EndSimulationPayload = {
  simulation_id?: string;
  feedback?: SimulationSessionFeedback;
};

const REQUIRED_FIELDS_ERROR = "Please complete all required fields";
const PROCESSING_ERROR = "We couldn’t process your request. Try again.";

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
    return NextResponse.json({ error: PROCESSING_ERROR }, { status: 400 });
  }

  if (!isNonEmptyString(payload.simulation_id)) {
<<<<<<< HEAD
    return NextResponse.json({ error: REQUIRED_FIELDS_ERROR }, { status: 400 });
  }
  if (!isValidSessionFeedback(payload.feedback)) {
    return NextResponse.json({ error: PROCESSING_ERROR }, { status: 400 });
=======
    return NextResponse.json(
      { error: "Simulation ID is required to save session feedback." },
      { status: 400 }
    );
  }
  if (!isValidSessionFeedback(payload.feedback)) {
    return NextResponse.json(
      { error: "Session feedback is invalid. Please retry ending the simulation." },
      { status: 400 }
    );
>>>>>>> 2788ed7 (enforce lesson schema with repair pass and strict validation)
  }

  try {
    const attempt = await createSimulationSessionFeedback({
      simulation_id: payload.simulation_id,
      feedback: payload.feedback,
    });
    return NextResponse.json({ ok: true, attempt });
  } catch (error) {
    console.error("Simulation end route failed:", {
      simulation_id: payload.simulation_id,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json(
      {
<<<<<<< HEAD
        ok: true,
        persisted: false,
        error: PROCESSING_ERROR,
=======
        error: "Simulation save failed while ending this session.",
>>>>>>> 2788ed7 (enforce lesson schema with repair pass and strict validation)
        ...(process.env.NODE_ENV !== "production"
          ? { details: error instanceof Error ? error.message : "unknown_end_error" }
          : {}),
      },
      { status: 200 }
    );
  }
}
