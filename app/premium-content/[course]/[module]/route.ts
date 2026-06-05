import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { getPremiumModuleFilePath } from "../../../../lib/premiumClasses";

type PremiumContentRouteProps = {
  params: {
    course: string;
    module: string;
  };
};

export async function GET(_: Request, { params }: PremiumContentRouteProps) {
  const entry = await getPremiumModuleFilePath(params.course, params.module);

  if (!entry) {
    return new NextResponse("Not found.", { status: 404 });
  }

  if (entry.module.isLocked) {
    return new NextResponse("Premium access required.", { status: 403 });
  }

  const html = await fs.readFile(entry.filePath, "utf-8");
  const sanitizedHtml = sanitizePremiumHtml(html);

  return new NextResponse(sanitizedHtml, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store, max-age=0",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

function sanitizePremiumHtml(html: string) {
  const withoutScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  const immersiveOverride = `
<style id="app-premium-override">
  html, body {
    overflow-x: hidden !important;
  }

  body {
    margin: 0 !important;
  }

  .sidebar,
  #sidebar,
  [class*="sidebar"] {
    display: none !important;
  }

  .main,
  #main,
  .content,
  .content-area,
  .page,
  .wrapper {
    margin-left: 0 !important;
    width: 100% !important;
    max-width: none !important;
  }

  .hero,
  .content-area,
  .content,
  .section,
  .container,
  .module-shell {
    padding-left: clamp(16px, 4vw, 48px) !important;
    padding-right: clamp(16px, 4vw, 48px) !important;
  }

  @media (max-width: 768px) {
    .hero,
    .content-area,
    .content,
    .section,
    .container,
    .module-shell {
      padding-left: 16px !important;
      padding-right: 16px !important;
    }
  }
<\/style>`;

  if (withoutScripts.includes("</head>")) {
    return withoutScripts.replace("</head>", `${immersiveOverride}</head>`);
  }

  return `${immersiveOverride}${withoutScripts}`;
}
