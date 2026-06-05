import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import vm from "vm";

const projectRoot = process.cwd();
const sourceDir =
  "/Users/IssoufK/Documents/Projects/ai-business-english-Premium courses html/brice_premiummodules10";
const destDir = path.join(
  projectRoot,
  "premium-content",
  "premium-classes",
  "executive-leadership-english"
);

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

function sanitizeStaticHtml(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<button id="mob-btn"[\s\S]*?<\/button>/i, "")
    .replace(/<div id="overlay"[\s\S]*?<\/div>/i, "")
    .replace(/<nav id="sidebar">[\s\S]*?<\/nav>/i, "")
    .replace(
      /<div style="margin-top:22px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;">[\s\S]*?<\/div>\s*<div class="final-result" id="final-res"><\/div>/i,
      '<div class="static-note">Interactive checks, AI feedback, and audio playback have been removed in this content-only pilot import.</div>'
    )
    .replace(/\s+on[a-zA-Z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/g, "")
    .replace(/https:\/\/api\.anthropic\.com\/v1\/messages/gi, "")
    .replace(/https:\/\/api\.openai\.com\/v1\/[^"'`\s)]+/gi, "")
    .replace(/fetch\(/gi, "disabledFetch(");
}

function injectStaticOverride(html) {
  const override = `
<style id="static-premium-override">
  #main { margin-left: 0 !important; width: 100% !important; }
  .section { display: block !important; }
  .hero, .content, .prog-wrap { max-width: 1200px; margin-left: auto; margin-right: auto; }
  #vex-0, #vex-1, #vex-2,
  #gex-0, #gex-1, #gex-2,
  [id^="wpanel-"] { display: block !important; }
  .l-transcript-box { display: block !important; }
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
  @media (max-width: 900px) {
    .hero, .content, .prog-wrap { padding-left: 18px !important; padding-right: 18px !important; }
  }
</style>`;

  return html.includes("</head>")
    ? html.replace("</head>", `${override}</head>`)
    : `${override}${html}`;
}

async function run() {
  const { readdir } = await import("fs/promises");
  await mkdir(destDir, { recursive: true });
  const files = (await readdir(sourceDir))
    .filter((file) => /\.html?$/i.test(file))
    .sort((a, b) => extractModuleNumber(a) - extractModuleNumber(b));

  if (files.length !== 12) {
    throw new Error(`Expected 12 HTML files, found ${files.length}`);
  }

  const summary = [];

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

    outputHtml = replacePlaceholder(
      outputHtml,
      "vex-0",
      renderedElements.get("vex-0")?.innerHTML ?? "",
      { style: "display:block" }
    );
    outputHtml = replacePlaceholder(
      outputHtml,
      "vex-1",
      renderedElements.get("vex-1")?.innerHTML ?? "",
      { style: "display:block" }
    );
    outputHtml = replacePlaceholder(
      outputHtml,
      "vex-2",
      renderedElements.get("vex-2")?.innerHTML ?? "",
      { style: "display:block" }
    );
    outputHtml = replacePlaceholder(
      outputHtml,
      "gex-0",
      renderedElements.get("gex-0")?.innerHTML ?? "",
      { style: "display:block" }
    );
    outputHtml = replacePlaceholder(
      outputHtml,
      "gex-1",
      renderedElements.get("gex-1")?.innerHTML ?? "",
      { style: "display:block" }
    );
    outputHtml = replacePlaceholder(
      outputHtml,
      "gex-2",
      renderedElements.get("gex-2")?.innerHTML ?? "",
      { style: "display:block" }
    );

    outputHtml = outputHtml.replace(
      /<div id="assessContainer"><\/div>/,
      `<div id="assessContainer">${renderedElements.get("assessContainer")?.innerHTML ?? ""}</div>`
    );

    outputHtml = sanitizeStaticHtml(outputHtml);
    outputHtml = injectStaticOverride(outputHtml);

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

    for (const pattern of unsafePatterns) {
      if (pattern.test(outputHtml)) {
        throw new Error(`Unsafe pattern remained in module ${moduleNumber}: ${pattern}`);
      }
    }

    const destPath = path.join(destDir, `module_${moduleNumber}.html`);
    await writeFile(destPath, outputHtml, "utf8");
    summary.push({ moduleNumber, title, destPath });
  }

  console.log(JSON.stringify(summary, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
