import "server-only";

import { createClient, type User } from "@supabase/supabase-js";
import { getSupabaseServiceRoleConfig } from "../supabase/server";

function createAdminDataClient() {
  const config = getSupabaseServiceRoleConfig();
  if (!config) return null;

  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AdminMetric =
  | { status: "available"; value: number }
  | { status: "unavailable"; reason: string };

async function countTable(table: string): Promise<AdminMetric> {
  const client = createAdminDataClient();
  if (!client) return { status: "unavailable", reason: "Service role is not configured." };

  const { count, error } = await client
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error || count === null) {
    return { status: "unavailable", reason: "Table or count is unavailable." };
  }
  return { status: "available", value: count };
}

export async function getAdminDatabaseMetrics() {
  const [lessons, courses, simulations] = await Promise.all([
    countTable("lessons"),
    countTable("courses"),
    countTable("simulations"),
  ]);

  const client = createAdminDataClient();
  let users: AdminMetric = {
    status: "unavailable",
    reason: "Service role is not configured.",
  };

  if (client) {
    const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (!error && typeof data.total === "number") {
      users = { status: "available", value: data.total };
    } else {
      users = { status: "unavailable", reason: "Auth user count is unavailable." };
    }
  }

  return { lessons, courses, simulations, users };
}

export type AdminUserRow = Pick<
  User,
  "id" | "email" | "created_at" | "last_sign_in_at" | "email_confirmed_at"
> & { role: string | null };

export async function listAdminUsers(page: number, perPage: number, search = "") {
  const client = createAdminDataClient();
  if (!client) {
    return {
      status: "unavailable" as const,
      reason: "SUPABASE_SERVICE_ROLE_KEY is not configured.",
      users: [] as AdminUserRow[],
      total: null,
      searchTruncated: false,
    };
  }

  const normalizedSearch = search.trim().toLowerCase().slice(0, 120);
  if (normalizedSearch) {
    const batchSize = 200;
    const maxPages = 25;
    const collected: User[] = [];
    let sourceTotal = 0;

    for (let currentPage = 1; currentPage <= maxPages; currentPage += 1) {
      const { data, error } = await client.auth.admin.listUsers({ page: currentPage, perPage: batchSize });
      if (error) {
        return {
          status: "unavailable" as const,
          reason: "Supabase Auth user search is unavailable.",
          users: [] as AdminUserRow[],
          total: null,
          searchTruncated: false,
        };
      }
      sourceTotal = data.total;
      collected.push(...data.users);
      if (collected.length >= data.total || data.users.length < batchSize) break;
    }

    const matches = collected
      .filter((user) =>
        [user.email || "", user.id]
          .some((value) => value.toLowerCase().includes(normalizedSearch))
      )
      .map(toAdminUserRow);

    return {
      status: "available" as const,
      users: matches.slice((page - 1) * perPage, page * perPage),
      total: matches.length,
      searchTruncated: collected.length < sourceTotal,
    };
  }

  const { data, error } = await client.auth.admin.listUsers({ page, perPage });
  if (error) {
    return {
      status: "unavailable" as const,
      reason: "Supabase Auth user listing is unavailable.",
      users: [] as AdminUserRow[],
      total: null,
      searchTruncated: false,
    };
  }

  return {
    status: "available" as const,
    users: data.users.map(toAdminUserRow),
    total: data.total,
    searchTruncated: false,
  };
}

function toAdminUserRow(user: User): AdminUserRow {
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    email_confirmed_at: user.email_confirmed_at,
    role: typeof user.app_metadata?.role === "string" ? user.app_metadata.role : null,
  };
}

export type GeneratedLessonRow = {
  id: string;
  title: string;
  topic: string;
  level: string;
  status: string;
  visibility: string;
  source_url: string | null;
  created_at: string | null;
};

export async function listGeneratedLessons(search: string, limit = 50) {
  const client = createAdminDataClient();
  if (!client) {
    return { status: "unavailable" as const, reason: "Service role is not configured.", lessons: [] as GeneratedLessonRow[] };
  }

  let query = client
    .from("lessons")
    .select("id,title,topic,level,status,visibility,source_url,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  const normalizedSearch = search.trim().replace(/[,%()]/g, " ");
  if (normalizedSearch) {
    query = query.or(`title.ilike.%${normalizedSearch}%,topic.ilike.%${normalizedSearch}%`);
  }

  const { data, error } = await query;
  if (error) {
    return { status: "unavailable" as const, reason: "Generated lesson metadata is unavailable.", lessons: [] as GeneratedLessonRow[] };
  }

  return { status: "available" as const, lessons: (data || []) as GeneratedLessonRow[] };
}
