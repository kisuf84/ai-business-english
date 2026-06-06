import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import vm from "vm";

const projectRoot = process.cwd();
const sourceRoot =
  "/Users/IssoufK/Documents/Projects/ai-business-english-Premium courses html";
const premiumRoot = path.join(projectRoot, "premium-content", "premium-classes");

const contentPlaceholderIds = [
  "overviewContent",
  "speakingContent",
  "wordBankContent",
  "readingContent",
  "gramRevContent",
  "writingContent",
  "listeningContent",
  "casesContent",
];

const unsafePatterns = [
  /<script\b/i,
  /\sonclick\s*=/i,
  /\sonsubmit\s*=/i,
  /\sonload\s*=/i,
  /\sonchange\s*=/i,
  /\soninput\s*=/i,
  /fetch\(/i,
  /api\.anthropic\.com/i,
  /api\.openai\.com/i,
];

const courseConfigs = [
  {
    sourceFolder: "brice_premiummodules10",
    slug: "executive-leadership-english",
    expectedCount: 12,
  },
  {
    sourceFolder: "brice_premiummodules8",
    slug: "consulting-strategy-english",
    expectedCount: 12,
  },
  {
    sourceFolder: "brice_premiummodules9",
    slug: "operations-manufacturing-english",
    expectedCount: 12,
  },
  {
    sourceFolder: "brice_premiummodules7",
    slug: "entrepreneurship-startups-english",
    expectedCount: 13,
  },
];

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&middot;/g, "·")
    .trim();
}

function extractModuleNumber(fileName) {
  const match = fileName.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function createElement() {
  return {
    innerHTML: "",
    textContent: "",
    value: "",
    disabled: false,
    dataset: {},
    style: {},
    className: "",
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() {
        return false;
      },
    },
    addEventListener() {},
    removeEventListener() {},
    getAttribute() {
      return "";
    },
    setAttribute() {},
    querySelectorAll() {
      return [];
    },
    querySelector() {
      return null;
    },
  };
}

function createFakeDom() {
  const elements = new Map();

  const getElementById = (id) => {
    if (!elements.has(id)) {
      elements.set(id, createElement());
    }
    return elements.get(id);
  };

  const document = {
    getElementById,
    querySelectorAll() {
      return [];
    },
    querySelector() {
      return null;
    },
    addEventListener() {},
    removeEventListener() {},
  };

  const window = {
    document,
    scrollTo() {},
    speechSynthesis: {
      getVoices() {
        return [];
      },
      speak() {},
      pause() {},
      resume() {},
      cancel() {},
      speaking: false,
      paused: false,
    },
  };

  return { elements, document, window };
}

function renderDynamicSections(scriptContent) {
  const { elements, document, window } = createFakeDom();
  const context = {
    console,
    document,
    window,
    fetch: async () => {
      throw new Error("fetch disabled during sanitization");
    },
    SpeechSynthesisUtterance: function SpeechSynthesisUtterance() {},
    alert() {},
    setTimeout(callback) {
      callback();
      return 0;
    },
    clearTimeout() {},
    setInterval() {
      return 0;
    },
    clearInterval() {},
  };

  vm.createContext(context);
  vm.runInContext(scriptContent, context, { timeout: 5000 });

  context.initOverview?.();
  context.initSpeaking?.();
  context.initWordBank?.();
  context.initReading?.();
  context.initVocab?.();
  context.showVocab?.(1);
  context.showVocab?.(2);
  context.initGrammar?.();
  context.showGram?.(1);
  context.showGram?.(2);
  context.initGramReview?.();
  context.initWriting?.();

  const writingTasks = vm.runInContext(
    "typeof writingTasks !== 'undefined' ? writingTasks.length : 0",
    context
  );
  for (let index = 1; index < writingTasks; index += 1) {
    context.showTask?.(index);
  }

  context.initListening?.();
  context.initCases?.();
  context.initAssessment?.();

  return elements;
}

function replacePlaceholder(html, id, content, options = {}) {
  const { className = "content", style } = options;
  const safeContent = content ?? "";
  const styleAttr = style ? ` style="${style}"` : "";
  const replacement = `<div class="${className}" id="${id}"${styleAttr}>${safeContent}</div>`;
  const pattern = new RegExp(
    `<div class="${className}" id="${id}"(?: style="[^"]*")?>[\\s\\S]*?<\\/div>`
  );

  return html.replace(pattern, replacement);
}

function restoreSidebarNavigation(html) {
  return html
    .split("\n")
    .map((line) =>
      line.replace(
        /<div class="nav-item([^"]*)" onclick="goTo\('([^']+)'\)">(.*)<\/div>/i,
        (_match, extraClasses, targetId, innerHtml) =>
          `<a class="nav-item${extraClasses}" href="#${targetId}">${innerHtml}</a>`
      )
    )
    .join("\n");
}

function sanitizeStaticHtml(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<button id="mob-btn"[\s\S]*?<\/button>/i, "")
    .replace(/<div id="overlay"[\s\S]*?<\/div>/i, "")
    .replace(/<nav id="sidebar">[\s\S]*?<\/nav>/i, "")
    .replace(
      /<div style="margin-top:22px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;">[\s\S]*?<\/div>\s*<div class="final-result" id="final-res"><\/div>/i,
      '<div class="static-note">Interactive checks, AI feedback, and audio playback have been removed in this content-only review import.</div>'
    )
    .replace(/\s+on[a-zA-Z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/g, "")
    .replace(/https:\/\/api\.anthropic\.com\/v1\/messages/gi, "")
    .replace(/https:\/\/api\.openai\.com\/v1\/[^"'`\s)]+/gi, "")
    .replace(/fetch\(/gi, "disabledFetch(");
}

function injectStaticOverride(html) {
  const override = `
<style id="static-premium-override">
  html { scroll-behavior: smooth; }
  body {
    margin: 0 !important;
    overflow-x: hidden !important;
  }
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
  #assessContainer {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
  #main {
    margin-left: 0 !important;
    display: block !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    min-height: 100vh !important;
  }
  #main .section {
    scroll-margin-top: 16px !important;
  }
  .hero, .content, .prog-wrap { max-width: 1200px; margin-left: auto; margin-right: auto; }
  #vex-0, #vex-1, #vex-2,
  #gex-0, #gex-1, #gex-2,
  [id^="wpanel-"],
  .l-transcript-box {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
  .l-controls, .l-progress, .clear-btn, .ac-btn, .gf-btn-bar, .ass-btn, .retry-btn, .btn-primary, #final-res { display: none !important; }
  .ex-tab, .mcq-opt, .tf-item-btn { pointer-events: none !important; }
  .static-note {
    margin: 24px 0 0;
    padding: 16px 18px;
    border: 1px solid rgba(17, 34, 64, 0.12);
    border-radius: 12px;
    background: rgba(255,255,255,0.7);
    font-size: 13px;
    line-height: 1.6;
    color: #1c2438;
  }
  #mob-btn, #overlay {
    display: none !important;
  }
  @media (max-width: 900px) {
    #main {
      width: 100% !important;
      min-height: 0 !important;
    }
    .hero, .content, .prog-wrap { padding-left: 18px !important; padding-right: 18px !important; }
  }
</style>`;

  return html.includes("</head>")
    ? html.replace("</head>", `${override}</head>`)
    : `${override}${html}`;
}

async function importCourse(config) {
  const sourceDir = path.join(sourceRoot, config.sourceFolder);
  const destDir = path.join(premiumRoot, config.slug);
  await mkdir(destDir, { recursive: true });

  const files = (await readdir(sourceDir))
    .filter((file) => /\.html?$/i.test(file))
    .sort((a, b) => extractModuleNumber(a) - extractModuleNumber(b));

  if (files.length !== config.expectedCount) {
    throw new Error(
      `Expected ${config.expectedCount} HTML files in ${config.sourceFolder}, found ${files.length}`
    );
  }

  const modules = [];

  for (const file of files) {
    const moduleNumber = extractModuleNumber(file);
    const sourcePath = path.join(sourceDir, file);
    const rawHtml = await readFile(sourcePath, "utf8");
    const titleMatch = rawHtml.match(/<title>(.*?)<\/title>/is);
    const title = decodeEntities(titleMatch?.[1] ?? `Module ${moduleNumber}`);
    const scripts = [...rawHtml.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
      .map((match) => match[1])
      .join("\n");

    const renderedElements = renderDynamicSections(scripts);
    const writingContent = renderedElements.get("writingContent");
    if (writingContent) {
      writingContent.innerHTML = writingContent.innerHTML.replace(
        /display:none/g,
        "display:block"
      );
    }
    const listeningContent = renderedElements.get("listeningContent");
    if (listeningContent) {
      listeningContent.innerHTML = listeningContent.innerHTML.replace(
        /style="display:none"/g,
        'style="display:block"'
      );
    }

    let outputHtml = rawHtml;

    for (const id of contentPlaceholderIds) {
      outputHtml = replacePlaceholder(
        outputHtml,
        id,
        renderedElements.get(id)?.innerHTML ?? ""
      );
    }

    for (const id of ["vex-0", "vex-1", "vex-2", "gex-0", "gex-1", "gex-2"]) {
      outputHtml = replacePlaceholder(
        outputHtml,
        id,
        renderedElements.get(id)?.innerHTML ?? "",
        { style: "display:block" }
      );
    }

    outputHtml = outputHtml.replace(
      /<div id="assessContainer"><\/div>/,
      `<div id="assessContainer">${renderedElements.get("assessContainer")?.innerHTML ?? ""}</div>`
    );

    outputHtml = restoreSidebarNavigation(outputHtml);
    outputHtml = sanitizeStaticHtml(outputHtml);
    outputHtml = injectStaticOverride(outputHtml);

    for (const pattern of unsafePatterns) {
      if (pattern.test(outputHtml)) {
        throw new Error(
          `Unsafe pattern remained in ${config.slug} module ${moduleNumber}: ${pattern}`
        );
      }
    }

    const destPath = path.join(destDir, `module_${moduleNumber}.html`);
    await writeFile(destPath, outputHtml, "utf8");
    modules.push({
      number: moduleNumber,
      title,
      destPath,
    });
  }

  return {
    slug: config.slug,
    sourceFolder: config.sourceFolder,
    moduleCount: modules.length,
    modules,
  };
}

async function run() {
  const summary = [];

  for (const config of courseConfigs) {
    summary.push(await importCourse(config));
  }

  console.log(JSON.stringify(summary, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
