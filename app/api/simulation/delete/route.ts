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
  console.info("[simulation-delete] auth user id", authUser.id);

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
  console.info("[simulation-delete] simulation id", simulationId);

  try {
    const simulation = await getSimulationSessionById(simulationId);
    const ownsSimulation = Boolean(simulation && simulation.user_id === authUser.id);
    console.info("[simulation-delete] ownership check result", {
      found: Boolean(simulation),
      ownsSimulation,
    });
    if (!ownsSimulation) {
      return NextResponse.json({ error: "Simulation not found." }, { status: 404 });
    }
    const result = await deleteSimulationSession(simulationId);
    console.info("[simulation-delete] delete success", result);
    return NextResponse.json({ status: "ok", ...result });
  } catch (error) {
    console.error("[simulation-delete] delete failure", error);
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
