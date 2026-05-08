import { NextResponse } from "next/server";
import {
  deleteSimulationSession,
  getSimulationSessionById,
} from "../../../../lib/data/simulations";
import { getRequestAuthUser } from "../../../../lib/supabase/auth";

const REQUIRED_FIELDS_ERROR = "Please complete all required fields";
const PROCESSING_ERROR = "We couldn’t process your request. Try again.";

export async function POST(request: Request) {
  const authUser = await getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

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
    const simulation = await getSimulationSessionById(simulationId);
    if (!simulation || simulation.user_id !== authUser.id) {
      return NextResponse.json({ error: "Simulation not found." }, { status: 404 });
    }
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
