export type SimulationScenarioType =
  | "meeting"
  | "negotiation"
  | "presentation"
  | "customer_service"
  | "email_response";

export type SimulationStartInput = {
  scenario_type: SimulationScenarioType;
  level: string;
  industry?: string;
  profession?: string;
};

export type SimulationMessageInput = SimulationStartInput & {
  simulation_id?: string | null;
  user_input: string;
  history: {
    role: "user" | "ai";
    content: string;
  }[];
};

export type SimulationMessageOutput = {
  response: string;
  feedback: {
    grammar: string;
    vocabulary: string;
    clarity: string;
    fluency: string;
  };
  suggestions: string[];
};

export type SimulationOverallFeedback = {
  sentenceStructure: string;
  grammar: string;
  vocabulary: string;
  fluency: string;
  relevance: string;
};

export type SimulationResponseCallout = {
  response: string;
  worked: string;
  improve: string;
  reason: string;
};

export type SimulationSessionFeedback = {
  overall: SimulationOverallFeedback;
  callouts: SimulationResponseCallout[];
  score_summary?: string | null;
};

export type SimulationRecord = {
  id: string;
  user_id: string | null;
  scenario_type: SimulationScenarioType;
  level: string;
  industry: string | null;
  profession: string | null;
  created_at: string;
};

export type SimulationAttemptRecord = {
  id: string;
  simulation_id: string;
  user_input: string;
  ai_response: string;
  feedback_json: SimulationMessageOutput["feedback"] & {
    suggestions: string[];
    meta?: {
      kind?: "message_feedback" | "session_feedback";
    };
    session_feedback?: SimulationSessionFeedback;
  };
  created_at: string;
};

export type Simulation = {
  id: string;
  scenarioType: string;
};
