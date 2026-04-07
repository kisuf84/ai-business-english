"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "../../../components/shared/Button";
import Card from "../../../components/shared/Card";
import Select from "../../../components/shared/Select";
import Textarea from "../../../components/shared/Textarea";
import { useTheme } from "../../../context/ThemeContext";
import { simulationCatalog } from "../../../lib/simulationCatalog";
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

function getLevelBadgeClass(level: string, mode: "light" | "dark"): string {
  const normalized = level.toUpperCase();
  if (normalized === "A2") {
    return mode === "light"
      ? "border-[rgba(63,104,86,0.18)] bg-[rgba(63,104,86,0.08)] text-[#315b4a]"
      : "border-[rgba(73,122,98,0.18)] bg-[rgba(73,122,98,0.1)] text-[var(--accent)]";
  }
  if (normalized === "B1" || normalized === "B2") {
    return mode === "light"
      ? "border-[rgba(179,131,34,0.24)] bg-[rgba(179,131,34,0.1)] text-[#8b6516]"
      : "border-[rgba(201,162,74,0.24)] bg-[var(--accent-gold-soft)] text-[var(--accent-gold)]";
  }
  return mode === "light"
    ? "border-[rgba(181,109,52,0.22)] bg-[rgba(181,109,52,0.1)] text-[var(--accent-warm)]"
    : "border-[rgba(166,93,46,0.18)] bg-[rgba(166,93,46,0.1)] text-[var(--accent-warm)]";
}

export default function SimulationPage() {
  const { mode, theme } = useTheme();
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
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [isStartingCustom, setIsStartingCustom] = useState(false);
  const [activeQuickStartId, setActiveQuickStartId] = useState<string | null>(null);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [customStartError, setCustomStartError] = useState<string | null>(null);
  const [quickStartError, setQuickStartError] = useState<string | null>(null);
  const [conversationErrorDetails, setConversationErrorDetails] = useState<string | null>(null);
  const [customStartErrorDetails, setCustomStartErrorDetails] = useState<string | null>(null);
  const [quickStartErrorDetails, setQuickStartErrorDetails] = useState<string | null>(null);

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
    scenarioId?: string;
    level?: string;
    industry?: string;
    role?: string;
  }): Promise<
    | { ok: true }
    | { ok: false; message: string; details: string | null }
  > => {
    const sourceHistory = params.historySeed ?? history;
    const nextHistory: ChatMessage[] = params.includeUserInHistory
      ? [
          ...sourceHistory,
          { role: "user", content: params.text.trim(), suggestions: [] },
        ]
      : sourceHistory;
    const messageScenarioId = params.scenarioId ?? selectedScenarioId;
    const messageLevel = params.level ?? level;
    const messageIndustry = params.industry ?? industry;
    const messageRole = params.role ?? role;
    const selectedScenario = scenarioOptions.find(
      (option) => option.id === messageScenarioId
    );
    const scenarioType = selectedScenario?.scenarioType ?? "meeting";
    const requestPayload = {
      simulation_id: simulationId,
      scenario_type: scenarioType,
      level: messageLevel,
      industry: messageIndustry.trim() || undefined,
      profession: messageRole.trim() || undefined,
      user_input: params.text.trim(),
      history: nextHistory.map(({ role, content }) => ({ role, content })),
    };

    if (process.env.NODE_ENV !== "production") {
      console.log("[simulation.page] sendSimulationMessage.request", {
        source: params.includeUserInHistory ? "conversation" : "start",
        scenarioId: messageScenarioId,
        scenarioType,
        level: messageLevel,
        industry: requestPayload.industry ?? null,
        profession: requestPayload.profession ?? null,
        historyLength: requestPayload.history.length,
        simulationId: requestPayload.simulation_id ?? null,
        userInputPreview: requestPayload.user_input.slice(0, 120),
      });
    }

    try {
      const response = await fetch("/api/simulation/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; details?: string | string[] }
          | null;
        const details =
          typeof payload?.details === "string"
            ? payload.details
            : Array.isArray(payload?.details)
              ? payload.details.join(" | ")
              : undefined;

        if (process.env.NODE_ENV !== "production") {
          console.error("[simulation.page] sendSimulationMessage.http_error", {
            status: response.status,
            payload,
          });
        }
        throw new Error(
          `${payload?.error || "send_failed"}${details ? `|${details}` : ""}`
        );
      }

      const raw = (await response.json()) as unknown;
      if (process.env.NODE_ENV !== "production") {
        console.log("[simulation.page] sendSimulationMessage.response", raw);
      }
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
      return { ok: true };
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "send_failed";
      const [publicMessage, details] = rawMessage.split("|");
      if (process.env.NODE_ENV !== "production") {
        console.error("[simulation.page] sendSimulationMessage.failure", {
          publicMessage,
          details: details ?? null,
          error: err,
        });
      }
      return {
        ok: false,
        message:
          process.env.NODE_ENV !== "production" &&
          publicMessage &&
          publicMessage !== "send_failed"
            ? publicMessage
            : "We could not send that message.",
        details:
          process.env.NODE_ENV !== "production" && details ? details : null,
      };
    }
  };

  const handleStartSimulation = async (
    overrides?: {
      scenarioId?: string;
      level?: string;
      industry?: string;
      role?: string;
    },
    source: "custom" | "quick-start" = "custom",
    quickStartId?: string
  ) => {
    if (
      isMessageLoading ||
      isStartingCustom ||
      activeQuickStartId !== null ||
      simulationStarted
    ) {
      return;
    }

    const setStartError = (message: string, details?: string | null) => {
      if (source === "quick-start") {
        setQuickStartError(message);
        setQuickStartErrorDetails(details ?? null);
        return;
      }

      setCustomStartError(message);
      setCustomStartErrorDetails(details ?? null);
    };

    setCustomStartError(null);
    setCustomStartErrorDetails(null);
    setQuickStartError(null);
    setQuickStartErrorDetails(null);
    setConversationError(null);
    setConversationErrorDetails(null);

    if (source === "quick-start") {
      setActiveQuickStartId(quickStartId ?? null);
    } else {
      setIsStartingCustom(true);
    }

    const nextScenarioId = overrides?.scenarioId ?? selectedScenarioId;
    const nextLevel = overrides?.level ?? level;
    const nextIndustry = overrides?.industry ?? industry;
    const nextRole = overrides?.role ?? role;

    if (!nextLevel.trim()) {
      setStartError("Please select a level before starting.");
      if (source === "quick-start") {
        setActiveQuickStartId(null);
      } else {
        setIsStartingCustom(false);
      }
      return;
    }

    const selectedScenario = scenarioOptions.find(
      (option) => option.id === nextScenarioId
    );

    if (!selectedScenario) {
      setStartError("This scenario is not configured correctly.");
      if (source === "quick-start") {
        setActiveQuickStartId(null);
      } else {
        setIsStartingCustom(false);
      }
      return;
    }

    setSimulationEnded(false);
    const scenarioLabel = selectedScenario.label ?? "Business conversation";
    const starterPrompt = [
      "[START_SIMULATION]",
      `Start the simulation as the conversation counterpart in a ${scenarioLabel}.`,
      `Level: ${nextLevel}`,
      `Industry: ${nextIndustry || "General business"}`,
      `Role: ${nextRole || "Business professional"}`,
      "Open naturally in-character.",
      "Do not thank the user for a prior message.",
      "Do not act like a writing assistant.",
    ].join(" ");

    setSelectedScenarioId(nextScenarioId);
    setLevel(nextLevel);
    setIndustry(nextIndustry);
    setRole(nextRole);
    const result = await sendSimulationMessage({
      text: starterPrompt,
      includeUserInHistory: false,
      historySeed: [],
      scenarioId: nextScenarioId,
      level: nextLevel,
      industry: nextIndustry,
      role: nextRole,
    });

    if (result.ok) {
      setSimulationStarted(true);
      setActiveTab("conversation");
    } else {
      setStartError(result.message, result.details);
    }

    if (source === "quick-start") {
      setActiveQuickStartId(null);
    } else {
      setIsStartingCustom(false);
    }
  };

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!simulationStarted || simulationEnded || !userInput.trim() || isMessageLoading) return;

    setIsMessageLoading(true);
    setConversationError(null);
    setConversationErrorDetails(null);

    const result = await sendSimulationMessage({
      text: userInput,
      includeUserInHistory: true,
    });

    if (!result.ok) {
      setConversationError(result.message);
      setConversationErrorDetails(result.details);
    }

    setIsMessageLoading(false);
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
    setConversationError(null);
    setConversationErrorDetails(null);
    setCustomStartError(null);
    setCustomStartErrorDetails(null);
    setQuickStartError(null);
    setQuickStartErrorDetails(null);
    setIsMessageLoading(false);
    setIsStartingCustom(false);
    setActiveQuickStartId(null);
    setActiveTab("conversation");
  };

  const handleStartCatalogScenario = async (scenario: (typeof simulationCatalog)[number]) => {
    await handleStartSimulation(
      {
        scenarioId: scenario.id,
        level: scenario.level,
        industry: scenario.industry,
        role: scenario.role,
      },
      "quick-start",
      scenario.id
    );
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
  const sectionCardStyle: React.CSSProperties = {
    background: "var(--surface-card)",
    borderColor: theme.colors.border,
  };
  const subtlePanelStyle: React.CSSProperties = {
    background: "var(--surface-raised)",
    borderColor: theme.colors.borderLight,
  };
  const feedbackBlockStyle: React.CSSProperties = {
    background: "var(--surface-card)",
    borderColor: theme.colors.border,
  };
  const errorStyle: React.CSSProperties = {
    color: theme.colors.danger,
  };
  const isAnyStartLoading = isStartingCustom || activeQuickStartId !== null;
  const isAnyRequestLoading = isMessageLoading || isAnyStartLoading;

  return (
    <section className="overflow-x-hidden py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Workplace Simulation
          </p>
          <h1 className="mt-2 text-balance font-serif text-2xl font-normal text-[var(--ink)] sm:text-3xl md:text-[2.15rem]">
            Simulation Hub
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-muted)] sm:text-[15px]">
            Start a guided workplace scenario instantly or build a custom simulation below.
          </p>
        </div>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <p className="shrink-0 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Custom Simulation Generator
          </p>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <Card className="p-6 sm:p-7" style={sectionCardStyle}>
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
                    disabled={isAnyRequestLoading}
                    className="w-full rounded-lg border px-5 py-2 text-xs font-semibold transition-opacity hover:opacity-90 sm:w-auto"
                    style={accentButtonStyle}
                  >
                    {isStartingCustom ? "Starting..." : "Start Conversation"}
                  </Button>
                ) : null}
                {simulationStarted || simulationEnded ? (
                  <Button
                    type="button"
                    onClick={handleReset}
                    disabled={isAnyRequestLoading}
                    className="w-full rounded-lg px-4 py-2 text-xs sm:w-auto"
                  >
                    Start New Conversation
                  </Button>
                ) : null}
                {customStartError ? (
                  <p className="min-w-0 text-xs" style={errorStyle}>
                    {customStartError}
                  </p>
                ) : null}
                {process.env.NODE_ENV !== "production" && customStartErrorDetails ? (
                  <p className="min-w-0 break-words text-xs text-[var(--ink-faint)]">
                    Debug: {customStartErrorDetails}
                  </p>
                ) : null}
              </div>
            </div>
          </form>
        </Card>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <p className="shrink-0 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Quick Start Scenarios
          </p>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <div className="mb-5">
          <p className="max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">
            Try a ready-made scenario with the role, industry, and level already filled in.
          </p>
          {quickStartError ? (
            <p className="mt-3 text-sm" style={errorStyle}>
              {quickStartError}
            </p>
          ) : null}
          {process.env.NODE_ENV !== "production" && quickStartErrorDetails ? (
            <p className="mt-2 break-words text-xs text-[var(--ink-faint)]">
              Debug: {quickStartErrorDetails}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {simulationCatalog.map((scenario) => {
            const isCardStarting = activeQuickStartId === scenario.id;

            return (
              <Card
                key={scenario.id}
                className="flex h-full min-w-0 flex-col gap-4 p-6"
                style={sectionCardStyle}
              >
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                  <div className="min-w-0">
                    <p className="text-base font-semibold leading-6 text-[var(--ink)] sm:text-lg">
                      {scenario.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                      {scenario.description}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getLevelBadgeClass(
                      scenario.level,
                      mode
                    )}`}
                  >
                    {scenario.level}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-faint)]">
                  <span className="rounded-full border border-[var(--border)] px-2.5 py-1">
                    {scenario.duration}
                  </span>
                  <span className="rounded-full border border-[var(--border)] px-2.5 py-1">
                    {scenario.role}
                  </span>
                  <span className="rounded-full border border-[var(--border)] px-2.5 py-1">
                    {scenario.industry}
                  </span>
                </div>

                <div className="mt-auto flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="text-xs text-[var(--ink-faint)]">Ready-to-start scenario</p>
                  <Button
                    type="button"
                    onClick={() => void handleStartCatalogScenario(scenario)}
                    disabled={simulationStarted || isAnyRequestLoading}
                    className="w-full rounded-lg border px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-90 sm:w-auto"
                    style={accentButtonStyle}
                  >
                    {isCardStarting ? "Starting..." : "Start"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("conversation")}
              className={`flex-1 rounded-lg border px-4 py-2 text-xs font-semibold transition sm:flex-none ${
                activeTab === "conversation"
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--border)] text-[var(--ink-muted)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              Conversation
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`flex-1 rounded-lg border px-4 py-2 text-xs font-semibold transition sm:flex-none ${
                activeTab === "history"
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--border)] text-[var(--ink-muted)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              History
            </button>
          </div>

          {activeTab === "conversation" ? (
            simulationStarted ? (
              <>
                <Card className="mb-4 p-4" style={subtlePanelStyle}>
                  <p className="text-xs leading-5 text-[var(--ink-muted)] sm:text-sm">
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
                <h2 className="font-serif text-xl text-[var(--ink)] sm:text-2xl">
                  Conversation
                </h2>

                {isMessageLoading ? (
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">
                    Loading response...
                  </p>
                ) : null}

                {history.length === 0 ? (
                  <Card className="mt-4 p-6" style={sectionCardStyle}>
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
                          <div className="w-full max-w-full sm:max-w-[88%] lg:max-w-[80%]">
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
                              className="overflow-hidden rounded-2xl border px-4 py-3"
                              style={
                                isUser
                                  ? {
                                      background: theme.colors.accentSoft,
                                      borderColor: theme.colors.accentMedium,
                                      color: theme.colors.ink,
                                    }
                                  : {
                                      background: "var(--surface-card)",
                                      borderColor: theme.colors.border,
                                      color: theme.colors.ink,
                                    }
                              }
                            >
                              <p className="whitespace-pre-wrap break-words text-sm leading-6">
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
                  <Card className="mt-6 p-6" style={sectionCardStyle}>
                    <h3 className="text-lg font-semibold text-[var(--ink)]">Overall Feedback</h3>
                    <ul className="mt-3 list-disc pl-5 text-sm leading-6 text-[var(--ink)]">
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
                            className="rounded-2xl border p-4"
                            style={feedbackBlockStyle}
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
                  <Card className="mt-6 p-6" style={sectionCardStyle}>
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
                          disabled={isMessageLoading}
                          required
                        />
                        {conversationError ? (
                          <p className="text-sm" style={errorStyle}>
                            {conversationError}
                          </p>
                        ) : null}
                        {process.env.NODE_ENV !== "production" && conversationErrorDetails ? (
                          <p className="break-words text-xs text-[var(--ink-faint)]">
                            Debug: {conversationErrorDetails}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            type="submit"
                            disabled={isMessageLoading}
                            className="w-full rounded-lg border px-5 py-2 text-xs font-semibold transition-opacity hover:opacity-90 sm:w-auto"
                            style={accentButtonStyle}
                          >
                            {isMessageLoading ? "Sending..." : "Send"}
                          </Button>
                          <Button
                            type="button"
                            onClick={handleEndConversation}
                            disabled={isMessageLoading}
                            className="w-full rounded-lg px-4 py-2 text-xs sm:w-auto"
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
              <Card className="p-6" style={sectionCardStyle}>
                <p className="text-sm text-[var(--ink-muted)]">
                  Configure your scenario and click Start Conversation to open the live chat with Mara.
                </p>
              </Card>
            )
          ) : (
            <Card className="p-6" style={sectionCardStyle}>
              <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <h2 className="font-serif text-xl text-[var(--ink)] sm:text-2xl">History</h2>
                <Button
                  type="button"
                  onClick={() => void loadHistory()}
                  disabled={isHistoryLoading}
                  className="w-full rounded-lg px-4 py-2 text-xs sm:w-auto"
                >
                  {isHistoryLoading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>

              {historyError ? (
                <p className="mb-4 text-sm" style={errorStyle}>
                  {historyError}
                </p>
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
                      className="rounded-2xl border p-4"
                      style={subtlePanelStyle}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-[var(--ink)]">
                          {getScenarioTypeLabel(session.scenario_type)} • {session.level}
                        </p>
                        <p className="text-xs text-[var(--ink-faint)]">
                          {formatDateTime(session.created_at)}
                        </p>
                      </div>
                      <p className="mt-1 break-words text-xs leading-5 text-[var(--ink-muted)]">
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
                            <div
                              key={attempt.id}
                              className="space-y-2 rounded-xl border p-3"
                              style={feedbackBlockStyle}
                            >
                              <p className="text-xs font-semibold text-[var(--ink-faint)]">You</p>
                              <p className="break-words text-sm text-[var(--ink)]">
                                {attempt.user_input}
                              </p>
                              <p className="text-xs font-semibold text-[var(--ink-faint)]">Mara</p>
                              <p className="break-words text-sm text-[var(--ink)]">
                                {attempt.ai_response}
                              </p>
                            </div>
                          ))}

                          <div className="rounded-xl border p-4" style={feedbackBlockStyle}>
                            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                              Session Feedback
                            </p>
                            {session.session_feedback?.overall ? (
                              <>
                                <ul className="mt-2 list-disc pl-5 text-sm leading-6 text-[var(--ink)]">
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
                                        className="rounded-xl border p-3"
                                        style={sectionCardStyle}
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
