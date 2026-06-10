import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { getPremiumModuleFilePath } from "../../../../lib/premiumClasses";

type PremiumContentRouteProps = {
  params: {
    course: string;
    module: string;
  };
};

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "private, no-store, max-age=0",
  "x-robots-tag": "noindex, nofollow",
} as const;

/**
 * Replace the direct Anthropic browser fetch with our server-side proxy.
 * This is the ONLY modification made to any premium content file.
 */
function patchAnthropicUrl(html: string): string {
  return html
    .replace(
      /fetch\('https:\/\/api\.anthropic\.com\/v1\/messages'/g,
      "fetch('/api/writing-feedback'"
    )
    .replace(
      /\s*'anthropic-dangerous-direct-browser-access'\s*:\s*'true',?\s*/g,
      " "
    );
}

export async function GET(_: Request, { params }: PremiumContentRouteProps) {
  const entry = await getPremiumModuleFilePath(params.course, params.module);

  if (!entry) {
    return new NextResponse("Not found.", { status: 404 });
  }

  if (entry.module.isLocked) {
    return new NextResponse("Premium access required.", { status: 403 });
  }

  const html = await fs.readFile(entry.filePath, "utf-8");

  return new NextResponse(patchAnthropicUrl(html), {
    status: 200,
    headers: HTML_HEADERS,
  });
}
