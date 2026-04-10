import { NextResponse } from "next/server";
import OpenAI from "openai";

import type {
  SimulationMessageInput,
  SimulationMessageOutput,
} from "../../../../types/simulation";
import {
  validateSimulationMessage,
  validateSimulationStart,
} from "../../../../lib/validators/simulation";
import {
  createSimulation,
  createSimulationAttempt,
} from "../../../../lib/data/simulations";

type ScenarioKey =
  | "job_interview"
  | "negotiation"
  | "presentation"
  | "sales_meeting"
  | "performance_review"
  | "customer_service_call"
  | "investor_pitch"
  | "conflict_resolution"
  | "project_kickoff"
  | "board_meeting"
  | "general_business";

type ScenarioProfile = {
  counterpart: string;
  goal: string;
  tone: string;
  opener: (ctx: Context) => string;
  followUpQuestions: string[];
  objections: string[];
};

type Context = {
  level: string;
  industry: string;
  role: string;
  scenarioLabel: string;
};

type ConversationStage = "opening" | "discovery" | "assessment" | "decision";

type InternalSimulationState = {
  stage: ConversationStage;
  turnCount: number;
  keyFacts: string[];
  likelyDecisions: string[];
  unresolvedFocus: string[];
};

function normalizeText(value: string | null | undefined): string {
  return (value || "").trim();
}

function sanitizeApiKey(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .trim()
    .replace(/['"]\s*>>\s*.+$/, "")
    .replace(/^['"]|['"]$/g, "");
}

function debugLog(stage: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  console.log(`[simulation.message] ${stage}`, details);
}

function createEphemeralSimulationId() {
  return `sim_${crypto.randomUUID()}`;
}

function mapProviderError(error: unknown): { userMessage: string; details: string } {
  const err = error as {
    message?: string;
    status?: number;
    code?: string;
    type?: string;
  };
  const details = err?.message || "unknown_provider_error";
  const lower = details.toLowerCase();

  if (
    err?.status === 429 ||
    err?.code === "insufficient_quota" ||
    lower.includes("insufficient_quota") ||
    lower.includes("quota") ||
    lower.includes("billing")
  ) {
    return {
      userMessage:
        "The AI service is temporarily unavailable because the current API quota has been exceeded.",
      details,
    };
  }

  if (lower.includes("rate limit")) {
    return {
      userMessage: "The AI service is temporarily rate-limited. Please try again shortly.",
      details,
    };
  }

  if (lower.includes("connection error") || lower.includes("fetch failed")) {
    return {
      userMessage: "The AI service is temporarily unavailable. Please try again shortly.",
      details,
    };
  }

  return {
    userMessage: "The AI service is temporarily unavailable. Please try again.",
    details,
  };
}

function detectScenarioKey(input: SimulationMessageInput): ScenarioKey {
  const raw = `${normalizeText(input.user_input)} ${input.history
    .map((item) => item.content)
    .join(" ")}`.toLowerCase();
  const hasInterviewSignal =
    raw.includes("job interview") ||
    raw.includes("recruitment interview") ||
    raw.includes("interviewing") ||
    raw.includes("interview ") ||
    raw.includes("hiring manager") ||
    raw.includes("candidate");

  if (hasInterviewSignal) {
    return "job_interview";
  }
  if (raw.includes("negotiation") || raw.includes("contract discussion")) {
    return "negotiation";
  }
  if (
    raw.includes("presentation") ||
    raw.includes("product demo") ||
    raw.includes("training session facilitation")
  ) {
    return "presentation";
  }
  if (raw.includes("sales meeting") || raw.includes("cold call")) {
    return "sales_meeting";
  }
  if (raw.includes("performance review") || raw.includes("annual review")) {
    return "performance_review";
  }
  if (
    raw.includes("customer service call") ||
    raw.includes("complaint handling")
  ) {
    return "customer_service_call";
  }
  if (raw.includes("investor pitch")) {
    return "investor_pitch";
  }
  if (raw.includes("conflict resolution")) {
    return "conflict_resolution";
  }
  if (raw.includes("project kickoff") || raw.includes("status update meeting")) {
    return "project_kickoff";
  }
  if (raw.includes("board meeting") || raw.includes("strategy planning session")) {
    return "board_meeting";
  }

  if (input.scenario_type === "negotiation") return "negotiation";
  if (input.scenario_type === "presentation") return "presentation";
  if (input.scenario_type === "customer_service") return "customer_service_call";
  return "general_business";
}

function scenarioLabelFromKey(key: ScenarioKey): string {
  const labels: Record<ScenarioKey, string> = {
    job_interview: "Job Interview",
    negotiation: "Negotiation",
    presentation: "Presentation",
    sales_meeting: "Sales Meeting",
    performance_review: "Performance Review",
    customer_service_call: "Customer Service Call",
    investor_pitch: "Investor Pitch",
    conflict_resolution: "Conflict Resolution",
    project_kickoff: "Project Kickoff",
    board_meeting: "Board Meeting",
    general_business: "Business Conversation",
  };
  return labels[key];
}

function isBasicLevel(level: string): boolean {
  const normalized = normalizeText(level).toUpperCase();
  return normalized === "A2" || normalized === "B1";
}

function getProfiles(): Record<ScenarioKey, ScenarioProfile> {
  return {
    job_interview: {
      counterpart: "Maria, Hiring Manager",
      goal: "assess fit, communication, and practical judgment",
      tone: "professional but probing",
      opener: (ctx) =>
        `Hi, thanks for joining. I'm Maria, Hiring Manager for our ${ctx.industry} team.

I understand you're interviewing for a ${ctx.role} position, and today I want to understand your practical experience and decision-making style.

To start, could you introduce yourself briefly and explain why this role is a strong fit for you right now?`,
      followUpQuestions: [
        "Could you share one recent example that shows how you created business impact?",
        "When deadlines conflict, how do you decide what to prioritize first?",
        "If you joined next month, what would your first 30 days look like?",
      ],
      objections: [
        "Your answer sounds broad. Please make it specific and measurable.",
        "I need clearer evidence of impact, not just responsibilities.",
      ],
    },
    negotiation: {
      counterpart: "Daniel, Procurement Lead",
      goal: "reach terms while protecting value and risk boundaries",
      tone: "firm and commercially focused",
      opener: (ctx) =>
        `Hi, thanks for meeting today. I'm Daniel, Procurement Lead for our ${ctx.industry} division.

We're reviewing terms for this agreement and need to balance budget, delivery reliability, and risk.

To get us started, what proposal are you putting on the table today, and where do you have flexibility?`,
      followUpQuestions: [
        "If we commit to a longer term, what trade-off can you offer on price or scope?",
        "How would your team protect delivery quality if demand increases quickly?",
        "What is your strongest position on payment terms, and where is there room to adjust?",
      ],
      objections: [
        "That offer is still above our budget ceiling.",
        "Those terms shift too much risk to our side.",
      ],
    },
    presentation: {
      counterpart: "Laura, Senior Stakeholder",
      goal: "evaluate clarity, structure, and decision readiness",
      tone: "direct and time-conscious",
      opener: (ctx) =>
        `Hi, good to see you. I'm Laura, and I'm representing the stakeholder panel for this ${ctx.industry} review.

We want to evaluate whether your recommendation is practical and ready for a decision.

Could you open with the business problem, your proposed solution, and the impact you expect?`,
      followUpQuestions: [
        "What is the one point you want this group to remember after this meeting?",
        "Which assumption in your proposal carries the highest execution risk?",
        "What specific decision are you asking us to make today?",
      ],
      objections: [
        "Your structure is unclear. Please summarize in one concise statement.",
        "I need clearer business impact, not only activity metrics.",
      ],
    },
    sales_meeting: {
      counterpart: "Thomas, Client Decision Maker",
      goal: "evaluate value, risk, and fit before committing",
      tone: "curious but skeptical",
      opener: (ctx) =>
        `Hi, thanks for taking the time. I'm Thomas, and I lead the decision process on our ${ctx.industry} side.

We're exploring options, but we need a clear case for business value before moving forward.

Could you explain the core problem you solve for a team like ours and why this is worth prioritizing now?`,
      followUpQuestions: [
        "How quickly should we expect measurable business results after launch?",
        "Why is your offer stronger than other options we could choose?",
        "What support does your team provide during the first 60 days after signing?",
      ],
      objections: [
        "This sounds interesting, but I still don't see urgent value.",
        "Your pricing feels high for the scope you're proposing.",
      ],
    },
    performance_review: {
      counterpart: "Elena, Direct Manager",
      goal: "evaluate performance, growth, and next-period expectations",
      tone: "balanced and constructive",
      opener: () =>
        `Hi, thanks for joining. I'm Elena, your manager for this review.

Today I'd like us to look at your impact this cycle and align on your development priorities for the next one.

Could you start by sharing your key achievements and one area you want to improve?`,
      followUpQuestions: [
        "Which result best demonstrates your impact on team or business outcomes?",
        "What support from me would help you perform at a higher level?",
        "What concrete development goal should we set for next quarter?",
      ],
      objections: [
        "Your examples are useful, but they need clearer outcomes.",
        "I want to hear more ownership in your improvement plan.",
      ],
    },
    customer_service_call: {
      counterpart: "Alex, Customer Operations Lead",
      goal: "resolve issue quickly while rebuilding trust",
      tone: "urgent but willing to cooperate",
      opener: () =>
        `Hi, this is Alex from operations. Thanks for joining quickly.

We're dealing with an unresolved issue that is impacting day-to-day business, so we need a clear path forward.

Can you walk me through what action you can take right now and when we should expect resolution?`,
      followUpQuestions: [
        "What exact timeline can you commit to for fixing this issue?",
        "What corrective action can you offer to rebuild trust with our team?",
        "What process change will prevent this issue from recurring next month?",
      ],
      objections: [
        "I've heard this before. I need a concrete commitment.",
        "That timeline is too slow for our business needs.",
      ],
    },
    investor_pitch: {
      counterpart: "Rachel, Investor Partner",
      goal: "test viability, economics, and execution risk",
      tone: "analytical and demanding",
      opener: () =>
        `Hi, great to meet you. I'm Rachel, Partner on the investment side.

We're interested in the opportunity, and we need a clear view of commercial potential and execution risk.

Could you open with the problem, your solution, and the strongest traction signal you have today?`,
      followUpQuestions: [
        "What is your current customer acquisition strategy, and what does it cost?",
        "Which unit economics are strongest today, and which still need improvement?",
        "What milestones will this funding round unlock in the next two quarters?",
      ],
      objections: [
        "Your growth plan sounds optimistic. What downside scenario have you modeled?",
        "I need stronger evidence of repeatable demand.",
      ],
    },
    conflict_resolution: {
      counterpart: "Nina, Cross-Functional Lead",
      goal: "de-escalate tension and align on practical next steps",
      tone: "direct but collaborative",
      opener: () =>
        `Hi, thanks for making time. I'm Nina, and I lead the partnering team on this project.

I know there has been friction between our teams, and we both want to get delivery back on track.

Can we start by identifying the main source of misalignment and what we each need to move forward?`,
      followUpQuestions: [
        "Which part of the current workflow is creating the most friction between teams?",
        "What agreement can we make today so this conflict does not repeat next sprint?",
        "How should we communicate progress so both teams stay aligned?",
      ],
      objections: [
        "That sounds fair in theory, but ownership is still unclear.",
        "I don't think that plan addresses the core bottleneck.",
      ],
    },
    project_kickoff: {
      counterpart: "David, Project Sponsor",
      goal: "align scope, owners, timeline, and success metrics",
      tone: "structured and execution-focused",
      opener: () =>
        `Hi, and welcome. I'm David, the project sponsor for this initiative.

The goal for this kickoff is to align scope, timeline, ownership, and key risks before execution starts.

Could you walk me through your plan, including who owns each workstream and how you'll manage delivery risk?`,
      followUpQuestions: [
        "What are the top three delivery risks, and how will you mitigate each one?",
        "How will we track progress weekly, and when should issues be escalated?",
        "Which dependencies are most likely to delay delivery?",
      ],
      objections: [
        "The timeline looks ambitious; where is the buffer?",
        "Roles overlap here. Please clarify accountability.",
      ],
    },
    board_meeting: {
      counterpart: "Sophie, Board Director",
      goal: "assess strategy quality and governance readiness",
      tone: "high-stakes and strategic",
      opener: () =>
        `Hi, thanks for joining the board session. I'm Sophie, one of the board directors.

We're here to review strategic performance, major risks, and where management needs board decisions.

Could you begin with a concise update on performance versus plan and the key decision you need from us today?`,
      followUpQuestions: [
        "Which KPI trend concerns you most right now, and why?",
        "Which strategic options did you reject, and what was your rationale?",
        "What board action is required today to keep execution on track?",
      ],
      objections: [
        "Your update is descriptive but not sufficiently decision-oriented.",
        "Risk controls are not convincing at this stage.",
      ],
    },
    general_business: {
      counterpart: "Jordan, Business Counterpart",
      goal: "move toward a concrete decision or next action",
      tone: "professional and practical",
      opener: (ctx) =>
        `Hi, thanks for joining. I'm Jordan, and I represent the ${ctx.industry} side of this discussion.

I understand we're meeting to move this ${ctx.scenarioLabel.toLowerCase()} toward a practical outcome.

To begin, could you share your objective and what success would look like from your perspective?`,
      followUpQuestions: [
        "What outcome do you want to secure by the end of this meeting?",
        "What business risks should we account for before committing to this direction?",
        "What practical next step should we agree on today?",
      ],
      objections: [
        "I need a clearer proposal before I can agree.",
        "Can you be more specific about impact and timing?",
      ],
    },
  };
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function toUserTurns(history: SimulationMessageInput["history"]): string[] {
  return history
    .filter((item) => item.role === "user")
    .map((item) => normalizeText(item.content))
    .filter(Boolean);
}

function deriveStage(scenarioKey: ScenarioKey, turnCount: number): ConversationStage {
  if (scenarioKey === "job_interview") {
    if (turnCount <= 1) return "opening";
    if (turnCount <= 3) return "discovery";
    if (turnCount <= 5) return "assessment";
    return "decision";
  }

  if (turnCount <= 1) return "opening";
  if (turnCount <= 3) return "discovery";
  if (turnCount <= 5) return "assessment";
  return "decision";
}

function extractKeyFacts(userTurns: string[]): string[] {
  const facts: string[] = [];
  for (const turn of userTurns) {
    const sentences = turn
      .split(/[.!?]+/)
      .map((item) => normalizeText(item))
      .filter(Boolean);
    for (const sentence of sentences) {
      if (sentence.length < 20 || sentence.length > 170) continue;
      const lower = sentence.toLowerCase();
      if (
        /\d/.test(sentence) ||
        lower.includes("launched") ||
        lower.includes("managed") ||
        lower.includes("built") ||
        lower.includes("prioritized") ||
        lower.includes("roadmap") ||
        lower.includes("stakeholder") ||
        lower.includes("budget") ||
        lower.includes("timeline")
      ) {
        facts.push(sentence);
      }
    }
  }
  return dedupe(facts).slice(0, 6);
}

function extractLikelyDecisions(userTurns: string[]): string[] {
  const decisions: string[] = [];
  for (const turn of userTurns) {
    const lower = turn.toLowerCase();
    if (lower.includes("next step") || lower.includes("phase one")) {
      decisions.push("Clarify next-step execution plan.");
    }
    if (lower.includes("budget") || lower.includes("cost") || lower.includes("$")) {
      decisions.push("Validate budget assumptions and expected return.");
    }
    if (lower.includes("timeline") || lower.includes("deadline")) {
      decisions.push("Confirm timeline realism and delivery risk.");
    }
    if (lower.includes("stakeholder") || lower.includes("alignment")) {
      decisions.push("Confirm stakeholder alignment and decision ownership.");
    }
    if (lower.includes("priority") || lower.includes("priorit")) {
      decisions.push("Pressure-test prioritization logic.");
    }
  }
  return dedupe(decisions).slice(0, 4);
}

function buildUnresolvedFocus(
  scenarioKey: ScenarioKey,
  stage: ConversationStage,
  keyFacts: string[]
): string[] {
  if (scenarioKey === "job_interview") {
    if (stage === "opening") {
      return ["Candidate fit summary", "Role-relevant impact example"];
    }
    if (stage === "discovery") {
      return ["Ownership depth", "Prioritization approach"];
    }
    if (stage === "assessment") {
      return ["Stakeholder management", "Execution trade-offs"];
    }
    return ["Role fit decision", "Hiring-risk mitigation"];
  }

  if (stage === "opening") return ["Problem framing", "Desired outcome"];
  if (stage === "discovery") return ["Assumptions", "Execution approach"];
  if (stage === "assessment") return ["Risks", "Trade-offs", "Decision criteria"];

  const fallback = keyFacts.length > 0 ? ["Concrete next step"] : ["Clarify decision path"];
  return fallback;
}

function buildInternalState(
  input: SimulationMessageInput,
  scenarioKey: ScenarioKey
): InternalSimulationState {
  const userTurns = toUserTurns(input.history);
  const turnCount = userTurns.length;
  const stage = deriveStage(scenarioKey, turnCount);
  const keyFacts = extractKeyFacts(userTurns);
  const likelyDecisions = extractLikelyDecisions(userTurns);
  const unresolvedFocus = buildUnresolvedFocus(scenarioKey, stage, keyFacts);

  return {
    stage,
    turnCount,
    keyFacts,
    likelyDecisions,
    unresolvedFocus,
  };
}

function buildSystemPrompt(params: {
  profile: ScenarioProfile;
  scenarioKey: ScenarioKey;
  level: string;
  industry: string;
  role: string;
  isBasic: boolean;
  state: InternalSimulationState;
}): string {
  const { profile, scenarioKey, level, industry, role, isBasic, state } = params;

  const languageGuidance = isBasic
    ? `The candidate's English level is ${level} (intermediate). Use clear, simple language and shorter sentences. Be patient and supportive.`
    : `The candidate's English level is ${level} (advanced). Use natural, professional language at a high register.`;

  return [
    `You are ${profile.counterpart}, conducting a ${scenarioLabelFromKey(scenarioKey)} with a candidate in the ${industry} industry.`,
    `The candidate's professional role is: ${role}.`,
    `Your goal in this conversation: ${profile.goal}.`,
    `Your tone: ${profile.tone}.`,
    `Current conversation stage: ${state.stage}.`,
    `User turns so far: ${state.turnCount}.`,
    `State memory - key facts: ${state.keyFacts.join(" | ") || "none yet"}.`,
    `State memory - likely decisions: ${state.likelyDecisions.join(" | ") || "none yet"}.`,
    `State memory - unresolved focus: ${state.unresolvedFocus.join(" | ") || "none yet"}.`,
    "",
    languageGuidance,
    "",
    "Behavioral rules:",
    "- Never quote or echo back the candidate's words verbatim. Paraphrase naturally.",
    "- Always acknowledge what the candidate shared before asking your next question. Build on their answer naturally.",
    "- Reference specific details from earlier in the conversation to show continuity (e.g., if they mentioned cross-functional teams, ask a follow-up about that before moving to a new topic).",
    "- Transition between topics smoothly. Do not jump to unrelated questions without bridging from the candidate's last answer.",
    "- Keep stage continuity: opening -> discovery -> assessment -> decision. Do not jump backwards unless clarification is needed.",
    "- Ask one concrete follow-up question that advances the current stage.",
    "- Keep responses conversational and natural, as a real interviewer would speak.",
    "- Keep your responses concise: 2–4 sentences per turn.",
    "- Stay fully in character at all times. Do not act as a writing assistant or language tutor.",
    "- Do not introduce yourself again after the opening turn.",
  ].join("\n");
}

async function generateConversationResponse(
  input: SimulationMessageInput
): Promise<string> {
  const profiles = getProfiles();
  const scenarioKey = detectScenarioKey(input);
  const profile = profiles[scenarioKey];
  const level = normalizeText(input.level || "B1").toUpperCase();
  const industry = normalizeText(input.industry) || "general business";
  const role = normalizeText(input.profession) || "business professional";
  const isBasic = isBasicLevel(level);
  const state = buildInternalState(input, scenarioKey);

  const isStartTurn =
    input.history.length === 0 ||
    normalizeText(input.user_input).toLowerCase().includes("[start_simulation]");

  debugLog("conversation.resolve", {
    scenarioKey,
    scenarioType: input.scenario_type,
    level,
    industry,
    role,
    historyLength: input.history.length,
    isStartTurn,
  });

  const buildSafeFollowUpFallback = () => {
    if (scenarioKey === "job_interview") {
      return "Thanks for sharing that. Your product management background sounds strong. Could you tell me about one product you worked on that you're especially proud of, and what your role was in its success?";
    }

    const questions = profile.followUpQuestions;
    const turnCount = input.history.filter((item) => item.role === "user").length;
    const nextQuestion =
      questions.length > 0
        ? questions[turnCount % questions.length]
        : "Could you walk me through your approach in a bit more detail?";

    if (isBasic) {
      return `Thanks for sharing that. ${nextQuestion}`;
    }
    return `Thanks, that's helpful context. ${nextQuestion}`;
  };

  // For the opening turn, return the predefined opener directly.
  if (isStartTurn) {
    const ctx: Context = {
      level,
      industry,
      role,
      scenarioLabel: scenarioLabelFromKey(scenarioKey),
    };
    debugLog("conversation.opener", {
      scenarioKey,
      counterpart: profile.counterpart,
    });
    return profile.opener(ctx);
  }

  try {
    const apiKey = sanitizeApiKey(process.env.OPENAI_API_KEY);
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY_MISSING");
    }

    const openai = new OpenAI({ apiKey });
    const systemPrompt = buildSystemPrompt({
      profile,
      scenarioKey,
      level,
      industry,
      role,
      isBasic,
      state,
    });

    // Build the full conversation history for the model.
    // Map "ai" roles to "assistant" and skip any [START_SIMULATION] trigger messages.
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [{ role: "system", content: systemPrompt }];
    for (const item of input.history) {
      const content = normalizeText(item.content);
      if (!content || content.toLowerCase().includes("[start_simulation]")) {
        continue;
      }
      messages.push({
        role: item.role === "ai" ? "assistant" : "user",
        content,
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 512,
      messages,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";

    if (!text) {
      throw new Error("OPENAI_EMPTY_RESPONSE");
    }
    debugLog("conversation.provider_success", {
      scenarioKey,
      messageCount: messages.length,
      responseLength: text.length,
    });
    return text;
  } catch (error) {
    console.error("[simulation/message] Full error:", error);
    const mapped = mapProviderError(error);
    const wrapped = new Error(mapped.userMessage);
    wrapped.cause = mapped.details;
    throw wrapped;
  }
}

function buildFeedback(input: SimulationMessageInput): SimulationMessageOutput["feedback"] {
  const level = normalizeText(input.level || "B1").toUpperCase();
  const isBasic = isBasicLevel(level);
  const text = normalizeText(input.user_input);

  const grammar = isBasic
    ? "Use simple sentence structure and check verb tense consistency."
    : "Good complexity overall; tighten sentence structure in longer points.";
  const vocabulary = isBasic
    ? "Use clear business words and avoid uncommon phrases."
    : "Use more precise commercial and decision-oriented vocabulary.";
  const clarity = text.length < 40
    ? "Add one concrete detail (number, deadline, or owner) to improve clarity."
    : "Strong direction; make priorities explicit to improve clarity.";
  const fluency = isBasic
    ? "Keep a steady pace and connect ideas with simple transitions."
    : "Flow is solid; use sharper transitions when shifting between arguments.";

  return { grammar, vocabulary, clarity, fluency };
}

function buildSuggestions(input: SimulationMessageInput): string[] {
  const level = normalizeText(input.level || "B1").toUpperCase();
  const isBasic = isBasicLevel(level);
  if (isBasic) {
    return [
      "State your goal in one short sentence first.",
      "Add one specific detail such as a date, number, or next step.",
    ];
  }

  return [
    "Lead with your objective, then support it with one concrete business fact.",
    "Close with a clear ask and a proposed timeline.",
  ];
}

export async function POST(request: Request) {
  let payload: SimulationMessageInput;
  let stage = "parse";
  try {
    payload = (await request.json()) as SimulationMessageInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    debugLog("request.received", {
      simulation_id: payload.simulation_id ?? null,
      scenario_type: payload.scenario_type,
      level: payload.level,
      industry: payload.industry ?? null,
      profession: payload.profession ?? null,
      user_input_preview: normalizeText(payload.user_input).slice(0, 120),
      history_length: Array.isArray(payload.history) ? payload.history.length : null,
    });

    stage = "validate_message";
    const validation = validateSimulationMessage(payload);

    if (!validation.ok) {
      debugLog("request.invalid", {
        stage,
        errors: validation.errors,
      });
      return NextResponse.json(
        { error: "Invalid payload", details: validation.errors },
        { status: 400 }
      );
    }

    let simulationId = payload.simulation_id ?? null;

    if (!simulationId) {
      stage = "validate_start";
      const startValidation = validateSimulationStart(payload);
      if (!startValidation.ok) {
        debugLog("request.invalid", {
          stage,
          errors: startValidation.errors,
        });
        return NextResponse.json(
          { error: "Invalid payload", details: startValidation.errors },
          { status: 400 }
        );
      }

      stage = "create_simulation";
      try {
        const simulation = await createSimulation(payload);
        simulationId = simulation.id;
        debugLog("persistence.simulation_created", {
          simulationId,
          scenario_type: simulation.scenario_type,
        });
      } catch (error) {
        simulationId = createEphemeralSimulationId();
        console.warn(
          "Simulation creation failed; continuing with ephemeral simulation id:",
          error
        );
        debugLog("persistence.simulation_skipped", {
          simulationId,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    stage = "generate_response";
    const response = await generateConversationResponse(payload);
    debugLog("response.generated", {
      simulationId,
      responseLength: response.length,
    });

    stage = "build_feedback";
    const feedback = buildFeedback(payload);
    const suggestions = buildSuggestions(payload);

    const output: SimulationMessageOutput = { response, feedback, suggestions };

    stage = "create_attempt";
    try {
      await createSimulationAttempt({
        simulation_id: simulationId,
        user_input: payload.user_input,
        ai_response: output.response,
        feedback_json: { ...output.feedback, suggestions: output.suggestions },
      });
      debugLog("persistence.attempt_created", {
        simulationId,
        suggestionCount: output.suggestions.length,
      });
    } catch (error) {
      console.warn(
        "Simulation attempt persistence failed; returning successful response anyway:",
        error
      );
      debugLog("persistence.attempt_skipped", {
        simulationId,
        reason: error instanceof Error ? error.message : String(error),
      });
    }

    stage = "respond";
    debugLog("response.success", {
      simulationId,
      hasFeedback: Boolean(output.feedback),
      suggestionCount: output.suggestions.length,
    });
    return NextResponse.json({ simulation_id: simulationId, ...output });
  } catch (err) {
    console.error("[simulation/message] Full error:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Simulation message failed";
    const causeDetails =
      err instanceof Error && typeof err.cause === "string" ? err.cause : null;

    const details =
      err instanceof Error
        ? `${stage}: ${causeDetails || err.message}${err.stack ? `\n${err.stack}` : ""}`
        : `unknown_simulation_error at ${stage}`;

    debugLog("response.failure", {
      stage,
      details,
    });

    return NextResponse.json(
      {
        error: errorMessage,
        ...(process.env.NODE_ENV !== "production" ? { details } : {}),
      },
      { status: 500 }
    );
  }
}
