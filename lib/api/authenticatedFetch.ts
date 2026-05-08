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

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

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
