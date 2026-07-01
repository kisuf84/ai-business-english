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

/**
 * Inject a nav-scroll fix so that clicking any .nav-item scrolls the viewport
 * to the newly-active section instead of to position 0 (the hero banner).
 * Covers all nav patterns: data-section listeners AND onclick="showSection()".
 */
function patchNavScroll(html: string): string {
  const script = `<script>
(function(){
  document.addEventListener('click',function(e){
    if(!e.target.closest('.nav-item'))return;
    setTimeout(function(){
      var el=document.querySelector('.section.active,.section-panel.active');
      if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
    },0);
  });
})();
</script>`;
  return html.includes("</body>") ? html.replace("</body>", script + "\n</body>") : html + script;
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

  return new NextResponse(patchNavScroll(patchAnthropicUrl(html)), {
    status: 200,
    headers: HTML_HEADERS,
  });
}
