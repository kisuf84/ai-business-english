type SupabaseConfig = {
  url: string;
  key: string;
};

export function getSupabaseAdminConfig(): SupabaseConfig | null {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export async function supabaseRest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getSupabaseAdminConfig();
  if (!config) {
    throw new Error("Supabase config not set.");
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
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
