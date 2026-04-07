import fs from "fs";
import path from "path";
import type {
  SimulationAttemptRecord,
  SimulationRecord,
  SimulationSessionFeedback,
  SimulationStartInput,
} from "../../types/simulation";
import { getSupabaseAdminConfig, supabaseRest } from "../supabase/server";

const DATA_PATH = path.join(process.cwd(), ".data", "simulations.json");
const ATTEMPTS_PATH = path.join(process.cwd(), ".data", "simulation_attempts.json");

type StoredSimulation = SimulationRecord;

type StoredAttempt = SimulationAttemptRecord;

function ensureDataFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "[]", "utf-8");
  }
}

function readAll<T>(filePath: string): T[] {
  ensureDataFile(filePath);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeAll<T>(filePath: string, records: T[]) {
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2), "utf-8");
}

function isSupabaseEnabled() {
  return Boolean(getSupabaseAdminConfig());
}

export async function createSimulation(
  input: SimulationStartInput
): Promise<SimulationRecord> {
  const now = new Date().toISOString();
  const payload: SimulationRecord = {
    id: crypto.randomUUID(),
    user_id: null,
    scenario_type: input.scenario_type,
    level: input.level,
    industry: input.industry ?? null,
    profession: input.profession ?? null,
    created_at: now,
  };

  if (isSupabaseEnabled()) {
    try {
      const [created] = await supabaseRest<SimulationRecord[]>("simulations", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          user_id: payload.user_id,
          scenario_type: payload.scenario_type,
          level: payload.level,
          industry: payload.industry,
          profession: payload.profession,
        }),
      });
      return created;
    } catch (error) {
      console.warn(
        "Falling back to local simulation storage because Supabase write failed:",
        error
      );
    }
  }

  const simulations = readAll<StoredSimulation>(DATA_PATH);
  simulations.unshift(payload);
  writeAll(DATA_PATH, simulations);
  return payload;
}

export async function createSimulationAttempt(params: {
  simulation_id: string;
  user_input: string;
  ai_response: string;
  feedback_json: SimulationAttemptRecord["feedback_json"];
  created_at?: string;
}): Promise<SimulationAttemptRecord> {
  const now = params.created_at ?? new Date().toISOString();
  const payload: SimulationAttemptRecord = {
    id: crypto.randomUUID(),
    simulation_id: params.simulation_id,
    user_input: params.user_input,
    ai_response: params.ai_response,
    feedback_json: params.feedback_json,
    created_at: now,
  };

  if (isSupabaseEnabled()) {
    try {
      const [created] = await supabaseRest<SimulationAttemptRecord[]>(
        "simulation_attempts",
        {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            simulation_id: payload.simulation_id,
            user_input: payload.user_input,
            ai_response: payload.ai_response,
            feedback_json: payload.feedback_json,
          }),
        }
      );
      return created;
    } catch (error) {
      console.warn(
        "Falling back to local simulation attempt storage because Supabase write failed:",
        error
      );
    }
  }

  const attempts = readAll<StoredAttempt>(ATTEMPTS_PATH);
  attempts.unshift(payload);
  writeAll(ATTEMPTS_PATH, attempts);
  return payload;
}

export async function createSimulationSessionFeedback(params: {
  simulation_id: string;
  feedback: SimulationSessionFeedback;
}): Promise<SimulationAttemptRecord> {
  return createSimulationAttempt({
    simulation_id: params.simulation_id,
    user_input: "[SESSION_FEEDBACK]",
    ai_response: "",
    feedback_json: {
      grammar: "",
      vocabulary: "",
      clarity: "",
      fluency: "",
      suggestions: [],
      meta: { kind: "session_feedback" },
      session_feedback: params.feedback,
    },
  });
}

export type SimulationSessionHistory = {
  simulation: SimulationRecord;
  attempts: SimulationAttemptRecord[];
};

function toSafeTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function listSimulationSessions(
  limit = 20
): Promise<SimulationSessionHistory[]> {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, limit)) : 20;

  if (isSupabaseEnabled()) {
    const simulations = await supabaseRest<SimulationRecord[]>(
      `simulations?select=*&order=created_at.desc&limit=${safeLimit}`
    );
    if (!simulations.length) return [];

    const ids = simulations.map((item) => item.id).filter(Boolean);
    const attempts = ids.length
      ? await supabaseRest<SimulationAttemptRecord[]>(
          `simulation_attempts?select=*&simulation_id=in.(${ids.join(",")})&order=created_at.asc`
        )
      : [];

    const grouped = new Map<string, SimulationAttemptRecord[]>();
    for (const attempt of attempts) {
      const existing = grouped.get(attempt.simulation_id) ?? [];
      existing.push(attempt);
      grouped.set(attempt.simulation_id, existing);
    }

    return simulations.map((simulation) => ({
      simulation,
      attempts: grouped.get(simulation.id) ?? [],
    }));
  }

  const simulations = readAll<StoredSimulation>(DATA_PATH)
    .sort((a, b) => toSafeTimestamp(b.created_at) - toSafeTimestamp(a.created_at))
    .slice(0, safeLimit);
  const attempts = readAll<StoredAttempt>(ATTEMPTS_PATH).sort(
    (a, b) => toSafeTimestamp(a.created_at) - toSafeTimestamp(b.created_at)
  );

  const grouped = new Map<string, SimulationAttemptRecord[]>();
  for (const attempt of attempts) {
    const existing = grouped.get(attempt.simulation_id) ?? [];
    existing.push(attempt);
    grouped.set(attempt.simulation_id, existing);
  }

  return simulations.map((simulation) => ({
    simulation,
    attempts: grouped.get(simulation.id) ?? [],
  }));
}
