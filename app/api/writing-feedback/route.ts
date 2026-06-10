import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getRequestAuthUser } from "../../../lib/supabase/auth";

type RequestBody = {
  model?: string;
  max_tokens?: number;
  system?: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
};

export async function POST(request: Request) {
  const authUser = await getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI writing feedback is not configured on this server." },
      { status: 503 }
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { max_tokens, system, messages } = body;

  if (!system || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Request must include system and messages fields." },
      { status: 400 }
    );
  }

  const validMessages = messages.every(
    (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
  );
  if (!validMessages) {
    return NextResponse.json({ error: "Invalid messages format." }, { status: 400 });
  }

  // Convert from Anthropic format (system + messages) to OpenAI format
  const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    ...messages,
  ];

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: typeof max_tokens === "number" ? Math.min(max_tokens, 2000) : 1200,
      messages: openAiMessages,
    });

    const text = response.choices[0]?.message?.content ?? "";

    // Return in the shape the client expects: { content: [{ text }] }
    return NextResponse.json({
      content: [{ type: "text", text }],
      model: response.model,
      usage: {
        input_tokens: response.usage?.prompt_tokens ?? 0,
        output_tokens: response.usage?.completion_tokens ?? 0,
      },
    });
  } catch (error) {
    console.error("[writing-feedback] OpenAI call failed", {
      user_id: authUser.id,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json(
      { error: "AI feedback temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }
}
