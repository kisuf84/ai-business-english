import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserConfigDiagnostics() {
  return {
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
  };
}

export function hasSupabaseBrowserConfig(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!hasSupabaseBrowserConfig()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      supabaseUrl as string,
      supabaseAnonKey as string
    );
  }

  return browserClient;
}
