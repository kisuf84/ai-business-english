function parseAllowlist(value: string | undefined): Set<string> {
  return new Set(
    (value || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

export type AdminIdentity = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
};

export function isAdminUser(user: AdminIdentity): boolean {
  const appRole = user.app_metadata?.role;
  if (typeof appRole === "string" && appRole.toLowerCase() === "admin") {
    return true;
  }

  const allowedIds = parseAllowlist(process.env.LANGSLATE_ADMIN_USER_IDS);
  if (allowedIds.has(user.id.toLowerCase())) return true;

  return false;
}

export function getAdminAuthorizationDiagnostics() {
  return {
    appMetadataRoleSupported: true,
    configuredUserIds: parseAllowlist(process.env.LANGSLATE_ADMIN_USER_IDS).size,
    defaultPolicy: "deny" as const,
  };
}
