export function safeInternalRedirect(value: string | null | undefined, fallback = "/dashboard") {
  const candidate = (value || "").trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, "https://langslate.local");
    if (parsed.origin !== "https://langslate.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
