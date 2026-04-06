import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient | null = null;

export function hasSupabaseBrowserConfig(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!hasSupabaseBrowserConfig()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}
