import { NextResponse } from "next/server";
import { deleteSimulationSession } from "../../../../lib/data/simulations";

const REQUIRED_FIELDS_ERROR = "Please complete all required fields";
const PROCESSING_ERROR = "We couldn’t process your request. Try again.";

export async function POST(request: Request) {
  let payload: { simulation_id?: string };

  try {
    payload = (await request.json()) as { simulation_id?: string };
  } catch {
    return NextResponse.json({ error: PROCESSING_ERROR }, { status: 400 });
  }

  const simulationId = payload?.simulation_id?.trim();
  if (!simulationId) {
    return NextResponse.json({ error: REQUIRED_FIELDS_ERROR }, { status: 400 });
  }

  try {
    await deleteSimulationSession(simulationId);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete simulation.",
        ...(process.env.NODE_ENV !== "production"
          ? { details: error instanceof Error ? error.message : "unknown_delete_error" }
          : {}),
      },
      { status: 500 }
    );
  }
}
