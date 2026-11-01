import { NextResponse } from "next/server";
import { getRequestAdminAuth } from "../../../../lib/admin/serverAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await getRequestAdminAuth(request);
  return NextResponse.json(
    { isAdmin: auth.status === "authorized" },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
