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
  /* ── Desktop: keep all sidebar variants always visible ───────────────────── */

  /* Courses 4–12: position:fixed #sidebar — cancel mobile translateX(-100%) */
  #sidebar {
    transform: none !important;
  }
  /* Hide client's own mobile toggle; we inject our own (#mob-toggle) */
  #mob-btn {
    display: none !important;
  }
  /* Courses 4–12: restore #main left margin (compensates for fixed sidebar) */
  #main {
    margin-left: var(--sidebar-w, 260px) !important;
  }
  /* Course 19: body-direct-child nav.sidebar — keep position:fixed at narrow viewports */
  body > nav.sidebar {
    position: fixed !important;
    width: var(--sidebar-w, 260px) !important;
    transform: none !important;
    max-height: none !important;
    height: 100vh !important;
  }
  /* B1/B2 mod 3-4: nav.sidebar is a sticky flex-child inside .main */
  .main > nav.sidebar {
    width: 280px !important;
    max-height: none !important;
    height: auto !important;
    flex-shrink: 0 !important;
    flex-direction: column !important;
    position: sticky !important;
    top: 0 !important;
  }
  /* .main: restore row layout (B1/B2 flex containers) and remove any margin.
     Sidebar is a flex child in those layouts so no external margin is needed. */
  .main {
    flex-direction: row !important;
    margin-left: var(--sidebar-w, 0px) !important;
  }
  /* Courses 1, 3, 19: body > nav.sidebar is position:fixed OUTSIDE .main.
     Higher specificity wins over the 0px fallback above; 260px matches the
     sidebar width we enforce on body > nav.sidebar for --sidebar-w-less courses. */
  body > nav.sidebar ~ .main {
    margin-left: var(--sidebar-w, 260px) !important;
  }
  /* Course 1 mod 3–8: <aside class="sidebar"> (uses --sidebar not --sidebar-w).
     Keep it fixed; restore left-margin on the sibling <main> content area. */
  aside.sidebar {
    position: fixed !important;
    transform: none !important;
    max-height: none !important;
    height: 100vh !important;
    width: var(--sidebar, var(--sidebar-w, 260px)) !important;
  }
  body > aside.sidebar ~ main {
    margin-left: var(--sidebar, var(--sidebar-w, 260px)) !important;
  }

  /* ── Mobile drawer chrome: hidden on desktop ─────────────────────────────── */
  #mob-toggle { display: none; }
  #mob-overlay { display: none; }

  /* ── Mobile (≤768px): collapsible drawer pattern ─────────────────────────── */
  @media (max-width: 768px) {
    /* All sidebar variants slide in from the left as an overlay drawer */
    #sidebar,
    body > nav.sidebar,
    aside.sidebar,
    .main > nav.sidebar {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      height: 100vh !important;
      width: 280px !important;
      max-height: none !important;
      z-index: 1000 !important;
      overflow-y: auto !important;
      transform: translateX(-100%) !important;
      transition: transform 0.25s ease !important;
    }
    #sidebar.mob-open,
    body > nav.sidebar.mob-open,
    aside.sidebar.mob-open,
    .main > nav.sidebar.mob-open {
      transform: translateX(0) !important;
    }
    /* Sidebar is now an overlay — remove layout compensation from main content */
    #main { margin-left: 0 !important; }
    .main,
    body > nav.sidebar ~ .main,
    body > aside.sidebar ~ main {
      margin-left: 0 !important;
      flex-direction: column !important;
    }
    /* Semi-transparent backdrop injected by initMobDrawer() */
    #mob-overlay.mob-open {
      display: block;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      z-index: 999;
      cursor: pointer;
    }
    /* Floating hamburger button injected by initMobDrawer() */
    #mob-toggle {
      display: flex;
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 1001;
      width: 40px;
      height: 40px;
      align-items: center;
      justify-content: center;
      background: rgba(10, 22, 40, 0.85);
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(4px);
    }
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

function getSidebar() {
  return document.getElementById('sidebar')
    || document.querySelector('body > nav.sidebar')
    || document.querySelector('body > aside.sidebar')
    || document.querySelector('.main > nav.sidebar');
}

function openMobSidebar() {
  var sb = getSidebar();
  var ov = document.getElementById('mob-overlay');
  var btn = document.getElementById('mob-toggle');
  if (sb) sb.classList.add('mob-open');
  if (ov) ov.classList.add('mob-open');
  if (btn) btn.innerHTML = '&#10005;';
}

function closeMobSidebar() {
  var sb = getSidebar();
  var ov = document.getElementById('mob-overlay');
  var btn = document.getElementById('mob-toggle');
  if (sb) sb.classList.remove('mob-open');
  if (ov) ov.classList.remove('mob-open');
  if (btn) btn.innerHTML = '&#9776;';
}

function openSidebar() { openMobSidebar(); }
function closeSidebar() { closeMobSidebar(); }

function initMobDrawer() {
  var sb = getSidebar();
  if (!sb) return;

  var ov = document.createElement('div');
  ov.id = 'mob-overlay';
  ov.addEventListener('click', closeMobSidebar);
  document.body.appendChild(ov);

  var btn = document.createElement('button');
  btn.id = 'mob-toggle';
  btn.setAttribute('aria-label', 'Open navigation menu');
  btn.innerHTML = '&#9776;';
  btn.addEventListener('click', function() {
    if (sb.classList.contains('mob-open')) {
      closeMobSidebar();
    } else {
      openMobSidebar();
    }
  });
  document.body.appendChild(btn);

  sb.addEventListener('click', function(e) {
    if (window.innerWidth > 768) return;
    if (e.target.closest('a[href], .nav-item, button.sidebar-item')) {
      setTimeout(closeMobSidebar, 80);
    }
  });
}

function initBriceNav() {
  document.querySelectorAll('.nav-item').forEach(function(btn) {
    var name = navItemSectionName(btn);
    if (!name) return;
    btn.setAttribute('data-section', name);
    btn.addEventListener('click', function() { showSection(name); });
  });
  showSection('overview');
  initMobDrawer();
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
