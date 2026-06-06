import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { getPremiumModuleFilePath } from "../../../../lib/premiumClasses";

type PremiumContentRouteProps = {
  params: {
    course: string;
    module: string;
  };
};

const BRICE_COURSE_SLUGS = new Set(["bricepremiumcourses1", "bricepremiumcourses2", "bricepremiumcourses3"]);

export async function GET(_: Request, { params }: PremiumContentRouteProps) {
  const entry = await getPremiumModuleFilePath(params.course, params.module);

  if (!entry) {
    return new NextResponse("Not found.", { status: 404 });
  }

  if (entry.module.isLocked) {
    return new NextResponse("Premium access required.", { status: 403 });
  }

  const isBriceCourse = BRICE_COURSE_SLUGS.has(params.course);
  const html = await fs.readFile(entry.filePath, "utf-8");
  const sanitizedHtml = sanitizePremiumHtml(html, isBriceCourse);

  return new NextResponse(sanitizedHtml, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store, max-age=0",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

function sanitizePremiumHtml(html: string, isBriceCourse: boolean) {
  const withoutScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  const sectionVisibilityOverride = isBriceCourse ? "" : `
  .section,
  .content,
  .card,
  #overviewContent,
  #speakingContent,
  #wordBankContent,
  #readingContent,
  #gramRevContent,
  #writingContent,
  #listeningContent,
  #casesContent,
  #assessContainer,
  #vex-0,
  #vex-1,
  #vex-2,
  #gex-0,
  #gex-1,
  #gex-2,
  [id^="wpanel-"],
  .l-transcript-box {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  #main {
    display: block !important;
    margin: 0 !important;
    min-height: 100vh !important;
  }

  #main .section {
    scroll-margin-top: 16px !important;
  }`;

  const appSidebarAndLayoutOverride = isBriceCourse ? "" : `
  .sidebar,
  #sidebar,
  #mob-btn,
  #overlay,
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
    min-width: 0 !important;
    max-width: none !important;
  }`;

  const immersiveOverride = `
<style id="app-premium-override">
  html {
    scroll-behavior: smooth;
  }

  html, body {
    overflow-x: hidden !important;
  }

  body {
    margin: 0 !important;
  }
${appSidebarAndLayoutOverride}
${sectionVisibilityOverride}
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

  /* Modules 3 & 5: plain <span> nav labels need flex:1 to match module 8's .nav-label rule */
  .sb-nav li a > span:not(.nav-icon):not(.nav-count):not(.nav-label) {
    flex: 1;
  }
<\/style>`;

  const showSectionScript = isBriceCourse ? `
<script>
function setActive(el) {
  document.querySelectorAll('.sb-nav a').forEach(function(a) { a.classList.remove('active'); });
  el.classList.add('active');
}

var showSec = showSection;

function showSection(name) {
  document.querySelectorAll('.section').forEach(function(el) {
    el.style.display = 'none';
    el.classList.remove('active');
  });

  // Some modules shorten IDs: vocabulary→vocab, grammar-review→gramreview, casestudies→cases.
  // Try the full sec-{name} first (works for modules using full names like sec-vocabulary),
  // then fall back to the shortened form before trying the legacy section-{name} prefix.
  var ID_SHORT = {'vocabulary':'vocab','grammar-review':'gramreview','casestudies':'cases'};
  var target = document.getElementById('sec-' + name)
    || (ID_SHORT[name] ? document.getElementById('sec-' + ID_SHORT[name]) : null)
    || document.getElementById('section-' + name)
    || document.getElementById(name);
  if (target) {
    target.style.display = 'block';
    target.classList.add('active');
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.querySelectorAll('.nav-item').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-section') === name);
  });
}

var TEXT_TO_SECTION = {
  'grammar review': 'grammar-review',
  'word bank': 'wordbank',
  'case studies': 'casestudies',
  'final assessment': 'assessment'
};

function navItemSectionName(btn) {
  var label = btn.querySelector('.nav-label');
  var text;
  if (label) {
    text = label.textContent.trim();
  } else {
    var clone = btn.cloneNode(true);
    [].forEach.call(clone.querySelectorAll('.icon,.badge,.nav-icon,.nav-badge,.ni,.nb'), function(el) {
      el.parentNode.removeChild(el);
    });
    text = clone.textContent.replace(/\\s+/g, ' ').trim();
  }
  var lower = text.toLowerCase();
  return TEXT_TO_SECTION[lower] || lower;
}

function initBriceNav() {
  document.querySelectorAll('.nav-item').forEach(function(btn) {
    var name = navItemSectionName(btn);
    if (!name) return;
    btn.setAttribute('data-section', name);
    btn.addEventListener('click', function() { showSection(name); });
  });
  showSection('overview');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBriceNav);
} else {
  initBriceNav();
}
<\/script>` : "";

  let result = isBriceCourse
    ? withoutScripts.replace(/ onclick="show(?:Section|Sec)\('[^']*'\)"/g, "")
    : withoutScripts;

  if (result.includes("</head>")) {
    result = result.replace("</head>", `${immersiveOverride}</head>`);
  } else {
    result = `${immersiveOverride}${result}`;
  }

  if (isBriceCourse) {
    if (result.includes("</body>")) {
      result = result.replace("</body>", `${showSectionScript}</body>`);
    } else {
      result = `${result}${showSectionScript}`;
    }
  }

  return result;
}
