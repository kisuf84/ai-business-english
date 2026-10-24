import "server-only";

import { createSupabaseServerClient } from "../supabase/ssr";
import { getRequestAuthUser } from "../supabase/auth";
import { isAdminUser, type AdminIdentity } from "./authorization";

export type AdminAuthResult =
  | { status: "authorized"; user: AdminIdentity }
  | { status: "unauthenticated"; user: null }
  | { status: "forbidden"; user: AdminIdentity }
  | { status: "unconfigured"; user: null };

export async function getServerAdminAuth(): Promise<AdminAuthResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "unconfigured", user: null };

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { status: "unauthenticated", user: null };

  if (!isAdminUser(data.user)) {
    return { status: "forbidden", user: data.user };
  }

  return { status: "authorized", user: data.user };
}

export async function getRequestAdminAuth(request: Request): Promise<AdminAuthResult> {
  const user = await getRequestAuthUser(request);
  if (!user) return { status: "unauthenticated", user: null };

  if (!isAdminUser(user)) {
    return { status: "forbidden", user };
  }

  return { status: "authorized", user };
}
