import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { getPremiumModuleFilePath } from "../../../../lib/premiumClasses";

type PremiumContentRouteProps = {
  params: {
    course: string;
    module: string;
  };
};

const BRICE_COURSE_SLUGS = new Set([
  "bricepremiumcourses1", "bricepremiumcourses2", "bricepremiumcourses3",
  "bricepremiumcourses4", "bricepremiumcourses5", "bricepremiumcourses6",
  "bricepremiumcourses7", "bricepremiumcourses8", "bricepremiumcourses9",
  "bricepremiumcourses10", "bricepremiumcourses11", "bricepremiumcourses12",
  "bricepremiumcourses13", "bricepremiumcourses14", "bricepremiumcourses15",
  "bricepremiumcourses16", "bricepremiumcourses17", "bricepremiumcourses18",
  "bricepremiumcourses19",
]);

// C1 reading (course17) uses DATA-driven per-category rendering — keep original scripts
const SCRIPTS_INTACT_SLUGS = new Set(["bricepremiumcourses17"]);

export async function GET(_: Request, { params }: PremiumContentRouteProps) {
  const entry = await getPremiumModuleFilePath(params.course, params.module);

  if (!entry) {
    return new NextResponse("Not found.", { status: 404 });
  }

  if (entry.module.isLocked) {
    return new NextResponse("Premium access required.", { status: 403 });
  }

  const isBriceCourse = BRICE_COURSE_SLUGS.has(params.course);
  const preserveScripts = SCRIPTS_INTACT_SLUGS.has(params.course);
  const html = await fs.readFile(entry.filePath, "utf-8");
  const sanitizedHtml = sanitizePremiumHtml(html, isBriceCourse, preserveScripts);

  return new NextResponse(sanitizedHtml, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store, max-age=0",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

function sanitizePremiumHtml(html: string, isBriceCourse: boolean, preserveScripts = false) {
  const withoutScripts = preserveScripts ? html : html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  // The iframe renders at ~774px on a 1024px laptop (app nav takes ~250px), which
  // triggers mobile breakpoints in the client HTML. Two patterns seen:
  //   - ID-based sidebars (courses 4–12): transform:translateX(-100%) hides them
  //   - Class-based sidebars (courses 15–16 modules 3–4, 19): flex-direction:column
  //     collapses them to a cramped top bar with max-height:220px
  // Force all sidebar variants to stay in left-column mode regardless of viewport width.
  const briceSidebarOverride = isBriceCourse ? `
  /* Courses 4–12: position:fixed #sidebar — cancel mobile translateX(-100%) */
  #sidebar {
    transform: none !important;
  }
  #mob-btn {
    display: none !important;
  }
  /* Courses 4–12: restore #main left margin (compensates for fixed sidebar) */
  #main {
    margin-left: var(--sidebar-w, 260px) !important;
  }
  /* Course 19: body-direct-child nav.sidebar uses position:fixed —
     prevent mobile breakpoint from switching it to position:relative */
  body > nav.sidebar {
    position: fixed !important;
    width: var(--sidebar-w, 260px) !important;
    transform: none !important;
    max-height: none !important;
    height: 100vh !important;
  }
  /* B1/B2 mod 3-4: nav.sidebar is a sticky flex-child inside .main —
     prevent mobile breakpoint from collapsing width + max-height */
  .main > nav.sidebar {
    width: 280px !important;
    max-height: none !important;
    height: auto !important;
    flex-shrink: 0 !important;
    flex-direction: column !important;
    position: sticky !important;
    top: 0 !important;
  }
  /* .main: restore row flex layout (B1/B2) and sidebar margin-left (course 19).
     --sidebar-w is 264px in course 19, undefined (→ 0px) in B1/B2. */
  .main {
    flex-direction: row !important;
    margin-left: var(--sidebar-w, 0px) !important;
  }
` : "";

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
${briceSidebarOverride}
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

function showCat(index, btn) {
  document.querySelectorAll('.category-section,.cat-sec').forEach(function(s) { s.classList.remove('active'); });
  document.querySelectorAll('nav button').forEach(function(b) { b.classList.remove('active'); });
  var cat = document.getElementById('cat' + index);
  if (cat) cat.classList.add('active');
  if (btn) btn.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openSidebar() {
  var sb = document.getElementById('sidebar');
  if (!sb) return;
  sb.style.transform = 'translateX(0)';
  sb.classList.add('open');
  var ov = document.getElementById('overlay');
  if (ov) ov.style.display = 'block';
}

function closeSidebar() {
  var sb = document.getElementById('sidebar');
  if (!sb) return;
  sb.style.transform = '';
  sb.classList.remove('open');
  var ov = document.getElementById('overlay');
  if (ov) ov.style.display = 'none';
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

// B2 reading (course16): switchCat toggles pre-rendered category panels
function switchCat(idxOrEvt, catKey) {
  if (typeof idxOrEvt === 'number') {
    // B2 module1 style: switchCat(idx) — numeric index, sidebar-section based
    var idx = idxOrEvt;
    document.querySelectorAll('.cat-tab').forEach(function(t, i) { t.classList.toggle('active', i === idx); });
    document.querySelectorAll('.sidebar-section').forEach(function(s, i) { s.classList.toggle('active', i === idx); });
    var firstItem = document.querySelector('.sidebar-section.active .sidebar-item');
    if (firstItem) {
      var panelIdx = parseInt(firstItem.getAttribute('data-idx') || '0', 10);
      if (!isNaN(panelIdx)) showText(panelIdx);
    }
  } else {
    // B2 module2+ style: switchCat(event, 'categoryKey') — key-based cat-section
    var evt = idxOrEvt;
    document.querySelectorAll('.cat-tab').forEach(function(t) { t.classList.remove('active'); });
    if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');
    document.querySelectorAll('.cat-section').forEach(function(s) { s.classList.remove('active'); });
    var target = document.getElementById('cat-' + catKey);
    if (target) target.classList.add('active');
    window.scrollTo(0, 0);
  }
}

function showText(idx) {
  document.querySelectorAll('.sidebar-item').forEach(function(el) { el.classList.remove('active'); });
  var item = document.querySelector('[data-idx="' + idx + '"]');
  if (item) item.classList.add('active');
  document.querySelectorAll('.text-panel').forEach(function(el) { el.classList.remove('active'); });
  var panel = document.getElementById('panel-' + idx);
  if (panel) panel.classList.add('active');
}

// B2: sidebar items use JS-assigned onclick (lost in pre-render) — rewire via delegation
(function() {
  var sb = document.getElementById('sidebar');
  if (sb) {
    sb.addEventListener('click', function(e) {
      var item = e.target.closest('.sidebar-item');
      if (!item) return;
      var idx = parseInt(item.getAttribute('data-idx') || '', 10);
      if (!isNaN(idx)) showText(idx);
    });
  }
})();

// Speaking volumes (course18): toggleLesson accordion
function toggleLesson(id) {
  var body = document.getElementById('body-' + id);
  var chev = document.getElementById('chev-' + id);
  if (!body) return;
  var open = body.classList.contains('open');
  body.classList.toggle('open', !open);
  if (chev) chev.classList.toggle('open', !open);
  var header = body.previousElementSibling;
  if (header) header.classList.toggle('open', !open);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBriceNav);
} else {
  initBriceNav();
}
<\/script>` : "";

  let result = isBriceCourse
    ? withoutScripts.replace(/ onclick="(?:show(?:Section|Sec)|goTo)\('[^']*'\)"/g, "")
    : withoutScripts;

  if (result.includes("</head>")) {
    result = result.replace("</head>", `${immersiveOverride}</head>`);
  } else {
    result = `${immersiveOverride}${result}`;
  }

  if (isBriceCourse && !preserveScripts) {
    if (result.includes("</body>")) {
      result = result.replace("</body>", `${showSectionScript}</body>`);
    } else {
      result = `${result}${showSectionScript}`;
    }
  }

  return result;
}
