import { createClient } from "@supabase/supabase-js";

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  access_token: string;
};

function readTokenFromAuthHeader(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function tryParseJsonToken(value: string): string | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed === "string") return null;
    if (Array.isArray(parsed)) {
      const first = parsed[0];
      if (typeof first === "string" && first.trim()) return first.trim();
      if (first && typeof first === "object") {
        const access = (first as Record<string, unknown>).access_token;
        if (typeof access === "string" && access.trim()) return access.trim();
      }
    }
    if (parsed && typeof parsed === "object") {
      const access = (parsed as Record<string, unknown>).access_token;
      if (typeof access === "string" && access.trim()) return access.trim();
    }
  } catch {
    return null;
  }
  return null;
}

function decodeBase64Url(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return Buffer.from(padded, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

function readTokenFromSupabaseCookie(cookieValue: string): string | null {
  const trimmed = cookieValue.trim();
  if (!trimmed) return null;

  const direct = tryParseJsonToken(trimmed);
  if (direct) return direct;

  if (trimmed.startsWith("base64-")) {
    const decoded = decodeBase64Url(trimmed.slice("base64-".length));
    if (!decoded) return null;
    return tryParseJsonToken(decoded);
  }

  return null;
}

function readTokenFromCookies(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());

  for (const part of parts) {
    const eqIndex = part.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = part.slice(0, eqIndex);
    if (!key.startsWith("sb-") || !key.endsWith("-auth-token")) continue;
    const rawValue = decodeURIComponent(part.slice(eqIndex + 1));
    const token = readTokenFromSupabaseCookie(rawValue);
    if (token) return token;
  }

  return null;
}

export async function getRequestAuthUser(request: Request): Promise<SupabaseUser | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const token =
    readTokenFromAuthHeader(request) ||
    readTokenFromCookies(request);
  if (!token) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.id) return null;

  return {
    id: data.user.id,
    email: data.user.email,
    user_metadata: data.user.user_metadata as Record<string, unknown> | undefined,
    access_token: token,
  };
}
