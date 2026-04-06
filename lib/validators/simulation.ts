import type {
  SimulationMessageInput,
  SimulationStartInput,
} from "../../types/simulation";

type ValidationResult = {
  ok: boolean;
  errors: string[];
};

export function validateSimulationStart(
  payload: SimulationStartInput
): ValidationResult {
  const errors: string[] = [];

  if (!payload.scenario_type) {
    errors.push("Scenario type is required.");
  }

  if (!payload.level?.trim()) {
    errors.push("Level is required.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function validateSimulationMessage(
  payload: SimulationMessageInput
): ValidationResult {
  const errors: string[] = [];

  if (!payload.scenario_type) {
    errors.push("Scenario type is required.");
  }

  if (!payload.level?.trim()) {
    errors.push("Level is required.");
  }

  if (!payload.user_input?.trim()) {
    errors.push("User input is required.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
