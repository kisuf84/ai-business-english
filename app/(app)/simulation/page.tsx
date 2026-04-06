"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "../../../components/shared/Button";
import Card from "../../../components/shared/Card";
import Select from "../../../components/shared/Select";
import Textarea from "../../../components/shared/Textarea";
import { useTheme } from "../../../context/ThemeContext";
import type {
  SimulationMessageOutput,
  SimulationSessionFeedback,
  SimulationScenarioType,
} from "../../../types/simulation";

type ChatMessage = {
  role: "user" | "ai";
  content: string;
  feedback?: SimulationMessageOutput["feedback"];
  suggestions: string[];
};

type OverallCoachingSummary = {
  sentenceStructure: string;
  grammar: string;
  vocabulary: string;
  fluency: string;
  relevance: string;
};

type UserResponseCallout = {
  response: string;
  worked: string;
  improve: string;
  reason: string;
};

type SimulationPageTab = "conversation" | "history";

type HistoryAttemptItem = {
  id: string;
  user_input: string;
  ai_response: string;
  created_at: string;
};

type HistorySessionItem = {
  simulation_id: string;
  scenario_type: SimulationScenarioType;
  level: string;
  industry: string | null;
  profession: string | null;
  created_at: string;
  message_count: number;
  attempts: HistoryAttemptItem[];
  lesson_links: string[];
  session_feedback?: SimulationSessionFeedback | null;
  overall_feedback?: OverallCoachingSummary | null;
  targeted_callouts?: UserResponseCallout[];
  score_summary?: string | null;
};

const scenarioOptions: Array<{
  id: string;
  label: string;
  scenarioType: SimulationScenarioType;
}> = [
  { id: "annual_review", label: "Annual Review", scenarioType: "meeting" },
  { id: "board_meeting", label: "Board Meeting", scenarioType: "meeting" },
  { id: "budget_meeting", label: "Budget Meeting", scenarioType: "meeting" },
  { id: "client_onboarding", label: "Client Onboarding", scenarioType: "meeting" },
  { id: "cold_call", label: "Cold Call", scenarioType: "customer_service" },
  { id: "complaint_handling", label: "Complaint Handling", scenarioType: "customer_service" },
  { id: "conflict_resolution", label: "Conflict Resolution", scenarioType: "meeting" },
  { id: "contract_discussion", label: "Contract Discussion", scenarioType: "negotiation" },
  {
    id: "cross_department_collaboration",
    label: "Cross-Department Collaboration",
    scenarioType: "meeting",
  },
  {
    id: "crisis_management_meeting",
    label: "Crisis Management Meeting",
    scenarioType: "meeting",
  },
  {
    id: "customer_service_call",
    label: "Customer Service Call",
    scenarioType: "customer_service",
  },
  { id: "investor_pitch", label: "Investor Pitch", scenarioType: "presentation" },
  { id: "job_interview", label: "Job Interview", scenarioType: "meeting" },
  { id: "negotiation", label: "Negotiation", scenarioType: "negotiation" },
  {
    id: "performance_review",
    label: "Performance Review",
    scenarioType: "meeting",
  },
  { id: "presentation", label: "Presentation", scenarioType: "presentation" },
  { id: "product_demo", label: "Product Demo", scenarioType: "presentation" },
  { id: "project_kickoff", label: "Project Kickoff", scenarioType: "meeting" },
  { id: "recruitment_interview", label: "Recruitment Interview", scenarioType: "meeting" },
  { id: "sales_meeting", label: "Sales Meeting", scenarioType: "meeting" },
  {
    id: "status_update_meeting",
    label: "Status Update Meeting",
    scenarioType: "meeting",
  },
  {
    id: "strategy_planning_session",
    label: "Strategy Planning Session",
    scenarioType: "meeting",
  },
  { id: "team_briefing", label: "Team Briefing", scenarioType: "meeting" },
  {
    id: "training_session_facilitation",
    label: "Training Session Facilitation",
    scenarioType: "presentation",
  },
  {
    id: "vendor_negotiation",
    label: "Vendor Negotiation",
    scenarioType: "negotiation",
  },
];

const roleOptions = [
  "Account Manager",
  "Administrative Assistant",
  "Business Analyst",
  "Business Development Manager",
  "CEO",
  "CFO",
  "CHRO",
  "CMO",
  "COO",
  "Compliance Officer",
  "Consultant",
  "CTO",
  "Customer Service Representative",
  "Customer Success Manager",
  "Data Analyst",
  "Department Manager",
  "Employee",
  "Executive Assistant",
  "Finance Analyst",
  "Financial Controller",
  "General Manager",
  "HR Manager",
  "HR Specialist",
  "IT Manager",
  "Legal Counsel",
  "Logistics Coordinator",
  "Marketing Manager",
  "Marketing Specialist",
  "Operations Manager",
  "Procurement Manager",
  "Product Manager",
  "Project Manager",
  "Recruiter",
  "Sales Manager",
  "Sales Representative",
  "Software Engineer",
  "Supply Chain Manager",
  "Team Leader",
  "Trainer",
] as const;

const industryOptions = [
  "Aerospace & Defense",
  "Agriculture & Food",
  "Automotive",
  "Construction & Engineering",
  "Education & Training",
  "Energy & Utilities",
  "Fashion & Apparel",
  "Finance & Banking",
  "Government & Public Sector",
  "Healthcare",
  "Hospitality & Tourism",
  "Human Resources",
  "Insurance",
  "Legal & Compliance",
  "Logistics & Supply Chain",
  "Manufacturing",
  "Marketing & Advertising",
  "Media & Entertainment",
  "Nonprofit & NGO",
  "Pharmaceuticals",
  "Real Estate",
  "Sales & Retail",
  "Technology & IT",
  "Telecommunications",
  "Transportation",
] as const;

const scenarioContextMeta: Record<
  string,
  { stakeholder: string; goal: string }
> = {
  sales_meeting: {
    stakeholder: "Client Decision Maker",
    goal: "Defend your value proposition and secure next steps.",
  },
  negotiation: {
    stakeholder: "Procurement Lead",
    goal: "Protect value while reaching workable terms.",
  },
  presentation: {
    stakeholder: "Stakeholder Panel",
    goal: "Present your recommendation and win alignment.",
  },
  job_interview: {
    stakeholder: "Hiring Manager",
    goal: "Show fit, impact, and communication strength.",
  },
  customer_service_call: {
    stakeholder: "Customer Operations Lead",
    goal: "Resolve the issue and rebuild confidence.",
  },
  performance_review: {
    stakeholder: "Direct Manager",
    goal: "Explain performance and agree on growth goals.",
  },
  project_kickoff: {
    stakeholder: "Project Sponsor",
    goal: "Align scope, ownership, and timeline.",
  },
  board_meeting: {
    stakeholder: "Board Director",
    goal: "Provide strategic clarity and ask for decisions.",
  },
  investor_pitch: {
    stakeholder: "Investor Partner",
    goal: "Defend your business case and funding plan.",
  },
  conflict_resolution: {
    stakeholder: "Cross-Functional Lead",
    goal: "De-escalate tension and agree on a plan.",
  },
};

function isValidFeedback(
  value: unknown
): value is SimulationMessageOutput["feedback"] {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.grammar === "string" &&
    typeof candidate.vocabulary === "string" &&
    typeof candidate.clarity === "string" &&
    typeof candidate.fluency === "string"
  );
}

function countWords(text: string): number {
  const words = text
    .toLowerCase()
    .match(/[a-zA-Z]+(?:'[a-zA-Z]+)?/g);
  return words ? words.length : 0;
}

function getScenarioKeywords(scenarioId: string): string[] {
  const byScenario: Record<string, string[]> = {
    job_interview: ["experience", "role", "team", "project", "impact", "stakeholder"],
    negotiation: ["terms", "price", "budget", "value", "risk", "timeline"],
    presentation: ["proposal", "recommendation", "impact", "plan", "decision"],
    sales_meeting: ["client", "value", "solution", "outcome", "implementation"],
    performance_review: ["goal", "impact", "improve", "result", "ownership"],
    customer_service_call: ["issue", "resolve", "timeline", "customer", "support"],
    investor_pitch: ["market", "growth", "traction", "revenue", "investment"],
    conflict_resolution: ["alignment", "ownership", "plan", "communication", "team"],
    project_kickoff: ["scope", "owner", "timeline", "risk", "milestone"],
    board_meeting: ["strategy", "kpi", "risk", "decision", "performance"],
  };
  return byScenario[scenarioId] ?? ["goal", "plan", "business", "outcome"];
}

function analyzeUserResponse(params: {
  text: string;
  scenarioKeywords: string[];
}) {
  const text = params.text.trim();
  const lower = text.toLowerCase();
  const words = countWords(text);
  const hasSentencePunctuation = /[.!?]$/.test(text);
  const startsCapitalized = /^[A-Z]/.test(text);
  const hasSpecificSignal = /\d|%|\$|timeline|week|month|quarter|deadline/i.test(text);
  const hasLinkers =
    /\b(because|so|therefore|however|first|then|finally|also)\b/i.test(text);
  const matchedKeywords = params.scenarioKeywords.filter((keyword) =>
    lower.includes(keyword)
  );
  const hasScenarioKeyword = matchedKeywords.length > 0;
  const missingKeyword = params.scenarioKeywords.find(
    (keyword) => !matchedKeywords.includes(keyword)
  );
  const responseSnippet = text.length > 90 ? `${text.slice(0, 90).trim()}...` : text;

  let coachingScore = 0;
  if (words < 10) coachingScore += 2;
  if (!hasSentencePunctuation) coachingScore += 1;
  if (!hasScenarioKeyword) coachingScore += 2;
  if (!hasSpecificSignal) coachingScore += 1;
  if (!startsCapitalized) coachingScore += 1;

  let worked = `Your response "${responseSnippet}" communicates a clear intent.`;
  if (hasSpecificSignal && hasScenarioKeyword) {
    worked = `You grounded your point with specific detail and scenario language (${matchedKeywords
      .slice(0, 2)
      .join(", ")}).`;
  } else if (hasLinkers) {
    worked = `You used linking language to connect ideas, which made the response easier to follow.`;
  } else if (words >= 16) {
    worked = "You gave enough detail to keep the conversation moving forward.";
  }

  let improve = "Add one concrete detail and close with a clear next step.";
  if (words < 10) {
    improve = "Expand your answer with one reason and one practical example.";
  } else if (!hasScenarioKeyword) {
    improve =
      "Tie your answer more directly to the current scenario question before adding extra context.";
  } else if (!hasSentencePunctuation || !startsCapitalized) {
    improve = "Use complete sentences with clear punctuation to improve readability.";
  } else if (!hasSpecificSignal) {
    improve = "Include measurable detail (timeline, metric, or ownership) to strengthen impact.";
  }

  if (!hasScenarioKeyword && missingKeyword) {
    improve = `Bring in scenario-specific language (for example: "${missingKeyword}") so your answer stays clearly on topic.`;
  }

  let reason = "Selected for useful coaching potential.";
  if (!hasScenarioKeyword) {
    reason = "Selected because this response drifted from the scenario focus.";
  } else if (words < 10) {
    reason = "Selected because expanding this short response would improve impact.";
  } else if (!hasSpecificSignal) {
    reason = "Selected because adding concrete evidence would make this answer stronger.";
  }

  return {
    coachingScore,
    words,
    hasScenarioKeyword,
    hasSpecificSignal,
    hasLinkers,
    worked,
    improve,
    reason,
  };
}

function buildConversationCoaching(params: {
  history: ChatMessage[];
  scenarioId: string;
  scenarioLabel: string;
}): { overall: OverallCoachingSummary; callouts: UserResponseCallout[] } {
  const userResponses = params.history
    .filter((message) => message.role === "user")
    .map((message) => message.content.trim())
    .filter(Boolean);

  if (userResponses.length === 0) {
    return {
      overall: {
        sentenceStructure: "No user responses were captured in this conversation.",
        grammar: "Start a new scenario and send at least two complete sentences.",
        vocabulary: "Use scenario-related business words to practice precision.",
        fluency: "Aim for steady, connected responses with one clear main point.",
        relevance: `Stay focused on ${params.scenarioLabel.toLowerCase()} goals and questions.`,
      },
      callouts: [],
    };
  }

  const keywords = getScenarioKeywords(params.scenarioId);
  const analyses = userResponses.map((response) => ({
    response,
    ...analyzeUserResponse({ text: response, scenarioKeywords: keywords }),
  }));

  const avgWords =
    analyses.reduce((total, item) => total + item.words, 0) / analyses.length;
  const relevantCount = analyses.filter((item) => item.hasScenarioKeyword).length;
  const specificCount = analyses.filter((item) => item.hasSpecificSignal).length;
  const fluentCount = analyses.filter((item) => item.hasLinkers).length;

  const offScope = relevantCount / analyses.length < 0.5;

  const overall: OverallCoachingSummary = {
    sentenceStructure:
      avgWords < 12
        ? "Your responses were clear but often short. Add one supporting sentence to complete each point."
        : "Sentence structure is generally clear. Keep grouping ideas into one main point plus one support point.",
    grammar:
      analyses.some((item) => item.coachingScore >= 3)
        ? "Grammar is understandable overall. Improve consistency with complete sentences and cleaner punctuation."
        : "Grammar is solid and professional. Keep verb tense and sentence endings consistent.",
    vocabulary:
      specificCount >= Math.ceil(analyses.length / 2)
        ? "Good use of practical business vocabulary. Continue using precise terms tied to outcomes."
        : "Vocabulary is clear. Add more topic-specific business terms to sound more confident and precise.",
    fluency:
      fluentCount >= Math.ceil(analyses.length / 2)
        ? "Fluency is steady and conversational. Transitions helped your ideas flow."
        : "Fluency is developing well. Add linking phrases like 'because', 'so', and 'therefore' to connect ideas.",
    relevance: offScope
      ? `You communicated clearly, but some answers drifted from the ${params.scenarioLabel.toLowerCase()} objective. Keep each response anchored to the question asked.`
      : `Your responses stayed aligned with the ${params.scenarioLabel.toLowerCase()} context. Keep connecting each point to business impact.`,
  };

  const topForCoaching = [...analyses]
    .sort((a, b) => b.coachingScore - a.coachingScore)
    .slice(0, Math.min(2, analyses.length))
    .map<UserResponseCallout>((item) => ({
      response: item.response,
      worked: item.worked,
      improve: item.improve,
      reason: item.reason,
    }));

  return {
    overall,
    callouts: topForCoaching,
  };
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown date";
  return parsed.toLocaleString();
}

function getScenarioTypeLabel(value: SimulationScenarioType): string {
  const labels: Record<SimulationScenarioType, string> = {
    meeting: "Meeting",
    negotiation: "Negotiation",
    presentation: "Presentation",
    customer_service: "Customer Service",
    email_response: "Email Response",
  };
  return labels[value] ?? "Conversation";
}

export default function SimulationPage() {
  const { theme } = useTheme();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("sales_meeting");
  const [level, setLevel] = useState("");
  const [industry, setIndustry] = useState("");
  const [role, setRole] = useState("");
  const [userInput, setUserInput] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<SimulationPageTab>("conversation");
  const [historySessions, setHistorySessions] = useState<HistorySessionItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [simulationEnded, setSimulationEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await fetch("/api/simulation/history");
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; details?: string }
          | null;
        throw new Error(payload?.error || "Failed to load history.");
      }
      const raw = (await response.json()) as unknown;
      if (!Array.isArray(raw)) {
        throw new Error("invalid_history_response");
      }
      const normalized = raw.filter(
        (item): item is HistorySessionItem =>
          item !== null &&
          typeof item === "object" &&
          typeof (item as HistorySessionItem).simulation_id === "string" &&
          Array.isArray((item as HistorySessionItem).attempts)
      );
      setHistorySessions(normalized);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "We could not load history.";
      setHistoryError(message);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      void loadHistory();
    }
  }, [activeTab]);

  const sendSimulationMessage = async (params: {
    text: string;
    includeUserInHistory: boolean;
    historySeed?: ChatMessage[];
  }): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);

    const sourceHistory = params.historySeed ?? history;
    const nextHistory: ChatMessage[] = params.includeUserInHistory
      ? [
          ...sourceHistory,
          { role: "user", content: params.text.trim(), suggestions: [] },
        ]
      : sourceHistory;
    const selectedScenario = scenarioOptions.find(
      (option) => option.id === selectedScenarioId
    );
    const scenarioType = selectedScenario?.scenarioType ?? "meeting";

    try {
      const response = await fetch("/api/simulation/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulation_id: simulationId,
          scenario_type: scenarioType,
          level,
          industry: industry.trim() || undefined,
          profession: role.trim() || undefined,
          user_input: params.text.trim(),
          history: nextHistory.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; details?: string }
          | null;
        const details =
          typeof payload?.details === "string" ? payload.details : undefined;
        throw new Error(
          `${payload?.error || "send_failed"}${details ? `|${details}` : ""}`
        );
      }

      const raw = (await response.json()) as unknown;
      if (!raw || typeof raw !== "object") {
        throw new Error("invalid_response");
      }

      const data = raw as Partial<
        SimulationMessageOutput & { simulation_id: string }
      >;

      if (typeof data.simulation_id !== "string" || typeof data.response !== "string") {
        throw new Error("invalid_response");
      }

      const suggestions = Array.isArray(data.suggestions)
        ? data.suggestions.filter(
            (item): item is string => typeof item === "string" && item.length > 0
          )
        : [];
      const aiMessage: ChatMessage = {
        role: "ai",
        content: data.response,
        feedback: isValidFeedback(data.feedback) ? data.feedback : undefined,
        suggestions,
      };

      setSimulationId(data.simulation_id);
      setHistory([...nextHistory, aiMessage]);
      if (params.includeUserInHistory) {
        setUserInput("");
      }
      return true;
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "send_failed";
      const [publicMessage, details] = rawMessage.split("|");
      if (process.env.NODE_ENV !== "production" && details) {
        setErrorDetails(details);
      }
      setError(
        process.env.NODE_ENV !== "production" &&
          publicMessage &&
          publicMessage !== "send_failed"
          ? publicMessage
          : "We could not send that message."
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSimulation = async () => {
    if (isLoading || simulationStarted) return;
    if (!level.trim()) {
      setError("Please select a level before starting.");
      return;
    }

    setSimulationEnded(false);
    const selectedScenario = scenarioOptions.find(
      (option) => option.id === selectedScenarioId
    );
    const scenarioLabel = selectedScenario?.label ?? "Business conversation";
    const starterPrompt = [
      "[START_SIMULATION]",
      `Start the simulation as the conversation counterpart in a ${scenarioLabel}.`,
      `Level: ${level}`,
      `Industry: ${industry || "General business"}`,
      `Role: ${role || "Business professional"}`,
      "Open naturally in-character.",
      "Do not thank the user for a prior message.",
      "Do not act like a writing assistant.",
    ].join(" ");
    const started = await sendSimulationMessage({
      text: starterPrompt,
      includeUserInHistory: false,
      historySeed: [],
    });
    if (started) {
      setSimulationStarted(true);
      setActiveTab("conversation");
    }
  };

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!simulationStarted || simulationEnded || !userInput.trim() || isLoading) return;
    await sendSimulationMessage({
      text: userInput,
      includeUserInHistory: true,
    });
  };

  const persistSessionFeedback = async () => {
    if (!simulationId) return;
    const feedbackPayload: SimulationSessionFeedback = {
      overall: conversationCoaching.overall,
      callouts: conversationCoaching.callouts,
      score_summary: null,
    };

    try {
      await fetch("/api/simulation/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulation_id: simulationId,
          feedback: feedbackPayload,
        }),
      });
    } catch (err) {
      console.error("Failed to persist session feedback", err);
    }
  };

  const handleEndConversation = () => {
    if (!simulationStarted || simulationEnded) return;
    setSimulationEnded(true);
    void persistSessionFeedback();
    void loadHistory();
  };

  const handleReset = () => {
    setHistory([]);
    setSimulationId(null);
    setSimulationStarted(false);
    setSimulationEnded(false);
    setUserInput("");
    setError(null);
    setErrorDetails(null);
    setIsLoading(false);
    setActiveTab("conversation");
  };

  const selectedScenario = scenarioOptions.find(
    (option) => option.id === selectedScenarioId
  );
  const contextMeta =
    (selectedScenario && scenarioContextMeta[selectedScenario.id]) || {
      stakeholder: "Business Stakeholder",
      goal: "Move the conversation to a clear next decision.",
    };
  const conversationCoaching = buildConversationCoaching({
    history,
    scenarioId: selectedScenarioId,
    scenarioLabel: selectedScenario?.label || "business conversation",
  });
  const accentButtonStyle: React.CSSProperties = {
    borderColor: theme.colors.accent,
    background: theme.colors.accent,
    color: theme.colors.accentInk,
  };

  return (
    <section className="py-10">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Workplace Simulation
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            Simulation
          </h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Practice real workplace communication and get instant AI feedback.
          </p>
        </div>

        <Card className="p-7">
          <form onSubmit={handleSend}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="scenario_type" className="text-sm font-medium">
                  Select a scenario
                </label>
                <Select
                  id="scenario_type"
                  value={selectedScenarioId}
                  onChange={(event) => setSelectedScenarioId(event.target.value)}
                  disabled={simulationStarted}
                >
                  {scenarioOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-2">
                <label htmlFor="level" className="text-sm font-medium">
                  Level
                </label>
                <Select
                  id="level"
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                  disabled={simulationStarted}
                  required
                >
                  <option value="">Select level</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="industry" className="text-sm font-medium">
                    Industry
                  </label>
                  <Select
                    id="industry"
                    value={industry}
                    onChange={(event) => setIndustry(event.target.value)}
                    disabled={simulationStarted}
                  >
                    <option value="">Select industry</option>
                    {industryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="profession" className="text-sm font-medium">
                    Business Role
                  </label>
                  <Select
                    id="profession"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    disabled={simulationStarted}
                  >
                    <option value="">Select business role</option>
                    {roleOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {!simulationStarted ? (
                  <Button
                    type="button"
                    onClick={() => void handleStartSimulation()}
                    disabled={isLoading}
                    className="rounded-lg border px-5 py-2 text-xs font-semibold transition-opacity hover:opacity-90"
                    style={accentButtonStyle}
                  >
                    {isLoading ? "Starting..." : "Start Conversation"}
                  </Button>
                ) : null}
                {simulationStarted || simulationEnded ? (
                  <Button
                    type="button"
                    onClick={handleReset}
                    disabled={isLoading}
                    className="rounded-lg px-4 py-2 text-xs"
                  >
                    Start New Conversation
                  </Button>
                ) : null}
                {error ? (
                  <p className="text-xs text-[var(--accent-warm)]">{error}</p>
                ) : null}
                {process.env.NODE_ENV !== "production" && errorDetails ? (
                  <p className="text-xs text-[var(--ink-faint)]">
                    Debug: {errorDetails}
                  </p>
                ) : null}
              </div>
            </div>
          </form>
        </Card>

        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("conversation")}
              className={`rounded-lg border px-4 py-2 text-xs font-semibold transition ${
                activeTab === "conversation"
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--surface)]"
                  : "border-[var(--border)] text-[var(--ink-muted)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              Conversation
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`rounded-lg border px-4 py-2 text-xs font-semibold transition ${
                activeTab === "history"
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--surface)]"
                  : "border-[var(--border)] text-[var(--ink-muted)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              History
            </button>
          </div>

          {activeTab === "conversation" ? (
            simulationStarted ? (
              <>
                <Card className="mb-4 p-4">
                  <p className="text-xs text-[var(--ink-muted)]">
                    Scenario: {selectedScenario?.label || "Business Conversation"}
                    {" • "}
                    Role: {role || "Business Professional"}
                    {" • "}
                    Stakeholder: {contextMeta.stakeholder}
                    {" • "}
                    Level: {level || "Not set"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-faint)]">
                    Goal: {contextMeta.goal}
                  </p>
                </Card>
                <h2 className="font-serif text-2xl text-[var(--ink)]">Conversation</h2>

                {isLoading ? (
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">
                    Loading response...
                  </p>
                ) : null}

                {history.length === 0 ? (
                  <Card className="mt-4 p-6">
                    <p className="text-sm text-[var(--ink-muted)]">
                      No messages yet. Start by sending your first response.
                    </p>
                  </Card>
                ) : (
                  <div className="mt-4 space-y-3">
                    {history.map((message, index) => {
                      const isUser = message.role === "user";
                      return (
                        <div
                          key={`${message.role}-${index}`}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div className="max-w-[80%]">
                            <div
                              className={`mb-1 flex items-center gap-2 ${
                                isUser ? "justify-end" : "justify-start"
                              }`}
                            >
                              {!isUser ? (
                                <span
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                                  style={{
                                    background: theme.colors.accent,
                                    color: theme.colors.accentInk,
                                  }}
                                >
                                  M
                                </span>
                              ) : null}
                              <span className="text-xs font-semibold text-[var(--ink-faint)]">
                                {isUser ? "You" : "Mara"}
                              </span>
                            </div>
                            <div
                              className="rounded-2xl border px-4 py-3"
                              style={
                                isUser
                                  ? {
                                      background: theme.colors.accentSoft,
                                      borderColor: theme.colors.accentMedium,
                                      color: theme.colors.ink,
                                    }
                                  : {
                                      background: theme.colors.surface,
                                      borderColor: theme.colors.border,
                                      color: theme.colors.ink,
                                    }
                              }
                            >
                              <p className="whitespace-pre-wrap text-sm leading-6">
                                {message.content || "No message content"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {simulationEnded ? (
                  <Card className="mt-6 p-6">
                    <h3 className="text-lg font-semibold text-[var(--ink)]">Overall Feedback</h3>
                    <ul className="mt-3 list-disc pl-5 text-sm text-[var(--ink)]">
                      <li>Sentence structure: {conversationCoaching.overall.sentenceStructure}</li>
                      <li>Grammar: {conversationCoaching.overall.grammar}</li>
                      <li>Vocabulary: {conversationCoaching.overall.vocabulary}</li>
                      <li>Fluency: {conversationCoaching.overall.fluency}</li>
                      <li>Relevance: {conversationCoaching.overall.relevance}</li>
                    </ul>

                    <div className="mt-6 space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                        Targeted Response Callouts
                      </p>
                      {conversationCoaching.callouts.length === 0 ? (
                        <p className="text-sm text-[var(--ink-muted)]">
                          Send a few responses in the next conversation to unlock targeted coaching.
                        </p>
                      ) : (
                        conversationCoaching.callouts.map((callout, index) => (
                          <div
                            key={`${callout.response.slice(0, 32)}-${index}`}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-4"
                          >
                            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                              Response {index + 1}
                            </p>
                            <p className="mt-2 text-sm text-[var(--ink)]">{callout.response}</p>
                            <p className="mt-3 text-xs text-[var(--ink-faint)]">
                              {callout.reason}
                            </p>
                            <p className="mt-2 text-sm text-[var(--ink)]">
                              <span className="font-semibold">What worked:</span> {callout.worked}
                            </p>
                            <p className="mt-1 text-sm text-[var(--ink)]">
                              <span className="font-semibold">Could improve:</span> {callout.improve}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                ) : null}

                {!simulationEnded ? (
                  <Card className="mt-6 p-6">
                    <form onSubmit={handleSend}>
                      <div className="grid gap-3">
                        <label htmlFor="user_input" className="text-sm font-medium">
                          Your Message
                        </label>
                        <Textarea
                          id="user_input"
                          value={userInput}
                          onChange={(event) => setUserInput(event.target.value)}
                          placeholder="Type your response..."
                          disabled={isLoading}
                          required
                        />
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="rounded-lg border px-5 py-2 text-xs font-semibold transition-opacity hover:opacity-90"
                            style={accentButtonStyle}
                          >
                            {isLoading ? "Sending..." : "Send"}
                          </Button>
                          <Button
                            type="button"
                            onClick={handleEndConversation}
                            disabled={isLoading}
                            className="rounded-lg px-4 py-2 text-xs"
                          >
                            End Conversation
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Card>
                ) : null}
              </>
            ) : (
              <Card className="p-6">
                <p className="text-sm text-[var(--ink-muted)]">
                  Configure your scenario and click Start Conversation to open the live chat with Mara.
                </p>
              </Card>
            )
          ) : (
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-serif text-2xl text-[var(--ink)]">History</h2>
                <Button
                  type="button"
                  onClick={() => void loadHistory()}
                  disabled={isHistoryLoading}
                  className="rounded-lg px-4 py-2 text-xs"
                >
                  {isHistoryLoading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>

              {historyError ? (
                <p className="mb-4 text-sm text-[var(--accent-warm)]">{historyError}</p>
              ) : null}

              {isHistoryLoading ? (
                <p className="text-sm text-[var(--ink-muted)]">Loading history...</p>
              ) : historySessions.length === 0 ? (
                <p className="text-sm text-[var(--ink-muted)]">
                  No previous simulations yet. Complete a conversation to see it here.
                </p>
              ) : (
                <div className="space-y-3">
                  {historySessions.map((session) => (
                    <div
                      key={session.simulation_id}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--ink)]">
                          {getScenarioTypeLabel(session.scenario_type)} • {session.level}
                        </p>
                        <p className="text-xs text-[var(--ink-faint)]">
                          {formatDateTime(session.created_at)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-[var(--ink-muted)]">
                        Role: {session.profession || "Business Professional"} • Industry:{" "}
                        {session.industry || "General Business"} • Messages:{" "}
                        {session.message_count}
                      </p>

                      {session.lesson_links.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {session.lesson_links.map((link) => (
                            <Link
                              key={link}
                              href={link}
                              className="text-xs text-[var(--accent)] underline-offset-4 hover:underline"
                            >
                              Related lesson: {link}
                            </Link>
                          ))}
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedHistoryId((prev) =>
                            prev === session.simulation_id ? null : session.simulation_id
                          )
                        }
                        className="mt-3 text-xs font-semibold text-[var(--accent)]"
                      >
                        {expandedHistoryId === session.simulation_id
                          ? "Hide Transcript"
                          : "View Transcript"}
                      </button>

                      {expandedHistoryId === session.simulation_id ? (
                        <div className="mt-3 space-y-2">
                          {session.attempts.map((attempt) => (
                            <div key={attempt.id} className="space-y-2 rounded-xl border border-[var(--border)] p-3">
                              <p className="text-xs font-semibold text-[var(--ink-faint)]">You</p>
                              <p className="text-sm text-[var(--ink)]">{attempt.user_input}</p>
                              <p className="text-xs font-semibold text-[var(--ink-faint)]">Mara</p>
                              <p className="text-sm text-[var(--ink)]">{attempt.ai_response}</p>
                            </div>
                          ))}

                          <div className="rounded-xl border border-[var(--border)] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                              Session Feedback
                            </p>
                            {session.session_feedback?.overall ? (
                              <>
                                <ul className="mt-2 list-disc pl-5 text-sm text-[var(--ink)]">
                                  <li>
                                    Sentence structure:{" "}
                                    {session.session_feedback.overall.sentenceStructure}
                                  </li>
                                  <li>Grammar: {session.session_feedback.overall.grammar}</li>
                                  <li>
                                    Vocabulary: {session.session_feedback.overall.vocabulary}
                                  </li>
                                  <li>Fluency: {session.session_feedback.overall.fluency}</li>
                                  <li>Relevance: {session.session_feedback.overall.relevance}</li>
                                </ul>
                                <div className="mt-4 space-y-3">
                                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                                    Targeted Response Callouts
                                  </p>
                                  {session.session_feedback.callouts.length === 0 ? (
                                    <p className="text-sm text-[var(--ink-muted)]">
                                      No targeted callouts were saved for this session.
                                    </p>
                                  ) : (
                                    session.session_feedback.callouts.map((callout, index) => (
                                      <div
                                        key={`${callout.response.slice(0, 28)}-${index}`}
                                        className="rounded-xl border border-[var(--border)] p-3"
                                      >
                                        <p className="text-xs font-semibold text-[var(--ink-faint)]">
                                          Response {index + 1}
                                        </p>
                                        <p className="mt-1 text-sm text-[var(--ink)]">
                                          {callout.response}
                                        </p>
                                        <p className="mt-2 text-xs text-[var(--ink-faint)]">
                                          {callout.reason}
                                        </p>
                                        <p className="mt-1 text-sm text-[var(--ink)]">
                                          <span className="font-semibold">What worked:</span>{" "}
                                          {callout.worked}
                                        </p>
                                        <p className="mt-1 text-sm text-[var(--ink)]">
                                          <span className="font-semibold">Could improve:</span>{" "}
                                          {callout.improve}
                                        </p>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </>
                            ) : (
                              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                                No saved feedback for this session.
                              </p>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
