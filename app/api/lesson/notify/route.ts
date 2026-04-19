import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const DATA_PATH = path.join(
  process.env.VERCEL ? "/tmp" : path.join(process.cwd(), ".data"),
  "lesson_notifications.json"
);

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, "[]", "utf-8");
  }
}

function readAll(): Array<Record<string, unknown>> {
  ensureDataFile();
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")) as unknown;
    return Array.isArray(parsed) ? (parsed as Array<Record<string, unknown>>) : [];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  let payload: { email?: string; source_url?: string; topic?: string };

  try {
    payload = (await request.json()) as {
      email?: string;
      source_url?: string;
      topic?: string;
    };
  } catch {
    return NextResponse.json(
      { error: "We couldn’t process your request. Try again." },
      { status: 400 }
    );
  }

  const email = payload.email?.trim().toLowerCase() || "";
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const records = readAll();
  records.unshift({
    id: crypto.randomUUID(),
    email,
    source_url: payload.source_url?.trim() || null,
    topic: payload.topic?.trim() || null,
    status: "captured",
    created_at: new Date().toISOString(),
  });
  fs.writeFileSync(DATA_PATH, JSON.stringify(records.slice(0, 500), null, 2), "utf-8");

  return NextResponse.json({ ok: true });
}
