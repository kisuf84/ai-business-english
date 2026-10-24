import { NextResponse } from "next/server";
import { getRequestAdminAuth } from "../../../../../lib/admin/serverAuth";
import { listAdminContentCatalog } from "../../../../../lib/admin/contentCatalog";
import { getLangslateContentUrl } from "../../../../../lib/langslateContent";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getRequestAdminAuth(request);
  if (auth.status === "unauthenticated" || auth.status === "unconfigured") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.status === "forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id")?.slice(0, 600) || "";
  if (!id) return NextResponse.json({ error: "Content id is required." }, { status: 400 });

  const item = (await listAdminContentCatalog()).find((candidate) => candidate.id === id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const target = item.source === "corporate" || item.source === "academy"
    ? getLangslateContentUrl(item.contentReference)
    : item.healthHref
      ? new URL(item.healthHref, request.url).toString()
      : null;

  if (!target) {
    return NextResponse.json({ status: "unavailable", detail: "No resolvable content URL is configured." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(target, {
      method: "HEAD",
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });

    if (response.ok) {
      return NextResponse.json({ status: "available", detail: "The content reference returned a successful response.", httpStatus: response.status });
    }
    if (response.status === 404 || response.status === 410) {
      return NextResponse.json({ status: "missing", detail: "The content reference was not found.", httpStatus: response.status });
    }
    return NextResponse.json({ status: "unavailable", detail: "The content host did not return a successful response.", httpStatus: response.status });
  } catch {
    return NextResponse.json({ status: "unavailable", detail: "The content host could not be reached within the timeout." });
  } finally {
    clearTimeout(timeout);
  }
}
