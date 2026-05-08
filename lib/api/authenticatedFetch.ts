import { getSupabaseBrowserClient } from "../supabase/client";

type AuthenticatedFetchOptions = RequestInit & {
  requireAuth?: boolean;
};

export async function authenticatedFetch(
  input: RequestInfo | URL,
  options: AuthenticatedFetchOptions = {}
): Promise<Response> {
  const { requireAuth = true, headers, ...rest } = options;
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    if (requireAuth) {
      throw new Error("Authentication required.");
    }
    return fetch(input, { ...rest, headers });
  }

  const resolveAccessToken = async (): Promise<string | null> => {
    const { data: immediate } = await supabase.auth.getSession();
    if (immediate.session?.access_token) {
      return immediate.session.access_token;
    }

    // Supabase can hydrate browser session asynchronously after redirects.
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    const { data: delayed } = await supabase.auth.getSession();
    return delayed.session?.access_token ?? null;
  };

  const accessToken = await resolveAccessToken();

  if (requireAuth && !accessToken) {
    throw new Error("Authentication required.");
  }

  const finalHeaders = new Headers(headers ?? {});
  if (accessToken) {
    finalHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(input, {
    ...rest,
    headers: finalHeaders,
  });
}
