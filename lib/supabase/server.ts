type SupabaseConfig = {
  url: string;
  key: string;
  keySource: "service_role" | "anon";
};

export function getSupabaseAdminConfig(): SupabaseConfig | null {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || "";
  const key = serviceRoleKey || anonKey;

  if (!url || !key) {
    return null;
  }

  return { url, key, keySource: serviceRoleKey ? "service_role" : "anon" };
}

export function getSupabaseServiceRoleConfig(): SupabaseConfig | null {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !key) {
    return null;
  }

  return { url, key, keySource: "service_role" };
}

export function getSupabaseServerDiagnostics() {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let urlHost: string | null = null;

  try {
    urlHost = url ? new URL(url).host : null;
  } catch {
    urlHost = "invalid_url";
  }

  return {
    hasUrl: Boolean(url),
    urlHost,
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY),
    adminKeySource: getSupabaseAdminConfig()?.keySource ?? null,
  };
}

async function supabaseRequest<T>(
  config: SupabaseConfig,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Supabase request failed.");
  }

  return (await response.json()) as T;
}

export async function supabaseRest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getSupabaseAdminConfig();
  if (!config) {
    throw new Error("Supabase config not set.");
  }

  return supabaseRequest<T>(config, path, options);
}

export async function supabaseServiceRoleRest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getSupabaseServiceRoleConfig();
  if (!config) {
    throw new Error("Supabase service role config not set.");
  }

  return supabaseRequest<T>(config, path, options);
}
