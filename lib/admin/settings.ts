import "server-only";

import { getAdminAuthorizationDiagnostics } from "./authorization";
import { getSupabaseServerDiagnostics } from "../supabase/server";

function safeHost(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return "invalid URL";
  }
}

export function getOperationalSettings() {
  return {
    supabase: getSupabaseServerDiagnostics(),
    authorization: getAdminAuthorizationDiagnostics(),
    contentHost: safeHost(process.env.LANGSLATE_CONTENT_BASE_URL),
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    hasCronSecret: Boolean(process.env.CRON_SECRET),
    thumbnailStorage: "Not provisioned (migration pending approval)",
    mutationMode: "Disabled",
  };
}
