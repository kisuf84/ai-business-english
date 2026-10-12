import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_ROOT = path.join(ROOT, "content-library");
const GENERATED_ROOT = path.join(ROOT, "generated-content", "image-optimized");
const PUBLIC_ASSET_ROOT = path.join(ROOT, "public", "optimized-content-assets");
const PUBLIC_ASSET_PREFIX = "/optimized-content-assets";

const SYNTAX_FLOW_LANGUAGES = ["espanol", "francais", "portugues"];
const SYNTAX_FLOW_SLUGS = ["a1", "a2", "b1", "b2", "c1"].flatMap((level) =>
  [1, 2, 3].map((volume) => `${level}-vol${volume}`)
);
const GOSSIP_SLUGS = [
  "gossip-a1-vol9",
  "gossip-a1-vol10",
  "gossip-a1-vol11",
  "gossip-a2-vol1",
  "gossip-a2-vol2",
  "gossip-a2-vol12",
  "gossip-b1-vol3",
  "gossip-b1-vol4",
  "gossip-b1-vol13",
  "gossip-b2-vol5",
  "gossip-b2-vol6",
  "gossip-b2-vol14",
  "gossip-c1-vol7",
  "gossip-c1-vol8",
  "gossip-c1-vol15",
];

const DEFAULT_SYNTAX_SAMPLE = [
  "syntax-flow-espanol/a1-vol1",
  "syntax-flow-espanol/b1-vol2",
  "syntax-flow-espanol/c1-vol3",
];
const DEFAULT_GOSSIP_SAMPLE = ["gossip-english/gossip-a1-vol9", "gossip-english/gossip-b2-vol5", "gossip-english/gossip-c1-vol7"];

const DATA_IMAGE_SRC = /src=(["'])data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=\s]+)\1/gi;
const RESPONSIVE_PATCH = `\n<style data-langslate-optimized-overflow-fix>\n@media (max-width: 480px) {\n  html, body { max-width: 100%; }\n  * { box-sizing: border-box; }\n  .nav { gap: 10px; padding-left: 16px; padding-right: 16px; }\n  .brand { gap: 10px; min-width: 0; }\n  .brand-mark { width: 36px; height: 36px; border-radius: 12px; flex: 0 0 36px; }\n  .brand-name { font-size: 18px; white-space: nowrap; }\n  .brand-tag { display: none; }\n  .nav-links { gap: 10px; flex-shrink: 0; }\n  .nav-links a:not(.nav-cta) { display: none; }\n  .nav-cta { padding: 10px 16px; font-size: 11px; }\n  .hero, .creator-section, footer, .progress-dashboard-wrap { width: 100%; max-width: 100%; }\n  .progress-dashboard-wrap { padding-left: 22px; padding-right: 22px; }\n  .dashboard-row, .dashboard-row .progress-dashboard, .score-card { width: 100%; min-width: 0; }\n  .score-card-glow { right: -110px; }\n  .creator-grid, .creator-portrait { max-width: 100%; }\n  .creator-portrait { width: min(284px, 100%); }\n  .creator-portrait::before { inset: -8px; }\n  .creator-portrait::after { inset: -16px; }\n  .creator-tag { right: 0; }\n  .modal-bg { width: 100%; max-width: 100%; padding-left: 16px; padding-right: 16px; }\n  .modal { width: 100%; max-width: 100%; }\n  .modal-body, .modal-head { padding-left: 20px; padding-right: 20px; }\n}\n</style>`;

function normalizeExtension(type) {
  return type.toLowerCase() === "jpeg" ? "jpg" : type.toLowerCase();
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: "syntax-sample",
    lessons: [],
    injectResponsivePatch: true,
  };

  for (const arg of args) {
    if (arg === "--syntax-sample") options.mode = "syntax-sample";
    else if (arg === "--syntax-all") options.mode = "syntax-all";
    else if (arg === "--gossip-sample") options.mode = "gossip-sample";
    else if (arg === "--gossip-all") options.mode = "gossip-all";
    else if (arg === "--no-responsive-patch") options.injectResponsivePatch = false;
    else options.lessons.push(arg);
  }

  return options;
}

function syntaxLessons() {
  return SYNTAX_FLOW_LANGUAGES.flatMap((language) =>
    SYNTAX_FLOW_SLUGS.map((slug) => `syntax-flow-${language}/${slug}`)
  );
}

function getRequestedLessons(options) {
  if (options.lessons.length > 0) return options.lessons;

  switch (options.mode) {
    case "syntax-all":
      return syntaxLessons();
    case "gossip-sample":
      return DEFAULT_GOSSIP_SAMPLE;
    case "gossip-all":
      return GOSSIP_SLUGS.map((slug) => `gossip-english/${slug}`);
    case "syntax-sample":
    default:
      return DEFAULT_SYNTAX_SAMPLE;
  }
}

function validateLessonId(lessonId) {
  const [library, slug] = lessonId.split("/");
  const isSyntax = library?.startsWith("syntax-flow-") && SYNTAX_FLOW_SLUGS.includes(slug);
  const isGossip = library === "gossip-english" && GOSSIP_SLUGS.includes(slug);

  if (!isSyntax && !isGossip) {
    throw new Error(`Unsupported lesson "${lessonId}". Use syntax-flow-<language>/<slug> or gossip-english/<slug>.`);
  }

  return { library, slug };
}

async function ensureDirectory(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileSize(filePath) {
  const stat = await fs.stat(filePath);
  return stat.size;
}

function applyResponsivePatch(html) {
  if (html.includes("data-langslate-optimized-overflow-fix")) return html;
  if (html.includes("</head>")) return html.replace("</head>", `${RESPONSIVE_PATCH}\n</head>`);
  return html;
}

function normalizeCanonicalForIntegrity(html) {
  return html.replace(DATA_IMAGE_SRC, 'src=$1__LANGSLATE_EXTRACTED_IMAGE__$1');
}

function normalizeOptimizedForIntegrity(html) {
  return html
    .replace(/src=(["'])\/optimized-content-assets\/[^"']+\1/g, 'src=$1__LANGSLATE_EXTRACTED_IMAGE__$1')
    .replace(`${RESPONSIVE_PATCH}\n`, "");
}

async function optimizeLesson(lessonId, options) {
  const { library, slug } = validateLessonId(lessonId);
  const sourcePath = path.join(CONTENT_ROOT, library, `${slug}.html`);
  const outputDir = path.join(GENERATED_ROOT, library);
  const outputPath = path.join(outputDir, `${slug}.html`);
  const assetDir = path.join(PUBLIC_ASSET_ROOT, library, slug);
  const assetUrlPrefix = `${PUBLIC_ASSET_PREFIX}/${library}/${slug}`;

  const sourceHtml = await fs.readFile(sourcePath, "utf8");
  const seenImages = new Map();
  const assetsToWrite = new Map();
  let embeddedImageCount = 0;
  let decodedImageBytes = 0;
  let uniqueImageCount = 0;

  let optimizedHtml = sourceHtml.replace(DATA_IMAGE_SRC, (_match, quote, type, base64) => {
    embeddedImageCount += 1;
    const bytes = Buffer.from(base64.replace(/\s+/g, ""), "base64");
    decodedImageBytes += bytes.length;

    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
    const filename = `image-${hash}.${normalizeExtension(type)}`;

    if (!seenImages.has(hash)) {
      uniqueImageCount += 1;
      seenImages.set(hash, filename);
      assetsToWrite.set(filename, bytes);
    }

    return `src=${quote}${assetUrlPrefix}/${seenImages.get(hash)}${quote}`;
  });

  if (options.injectResponsivePatch) {
    optimizedHtml = applyResponsivePatch(optimizedHtml);
  }

  const sourceIntegrity = normalizeCanonicalForIntegrity(sourceHtml);
  const optimizedIntegrity = normalizeOptimizedForIntegrity(optimizedHtml);
  if (sourceIntegrity !== optimizedIntegrity) {
    throw new Error(`Integrity check failed for ${lessonId}: optimized HTML changed content outside image srcs/CSS patch.`);
  }

  await ensureDirectory(outputDir);
  await fs.rm(assetDir, { recursive: true, force: true });
  await ensureDirectory(assetDir);

  for (const [filename, bytes] of assetsToWrite) {
    await fs.writeFile(path.join(assetDir, filename), bytes);
  }
  await fs.writeFile(outputPath, optimizedHtml, "utf8");

  let assetBytes = 0;
  for (const filename of assetsToWrite.keys()) {
    assetBytes += await fileSize(path.join(assetDir, filename));
  }

  return {
    lesson: lessonId,
    sourcePath: path.relative(ROOT, sourcePath),
    outputPath: path.relative(ROOT, outputPath),
    sourceBytes: await fileSize(sourcePath),
    optimizedHtmlBytes: await fileSize(outputPath),
    embeddedImageCount,
    uniqueImageCount,
    decodedImageBytes,
    assetBytes,
  };
}

async function main() {
  const options = parseArgs();
  const lessons = getRequestedLessons(options);
  const results = [];

  for (const lessonId of lessons) {
    results.push(await optimizeLesson(lessonId, options));
  }

  console.table(
    results.map((result) => ({
      lesson: result.lesson,
      sourceKB: Math.round(result.sourceBytes / 1024),
      optimizedHtmlKB: Math.round(result.optimizedHtmlBytes / 1024),
      embeddedImages: result.embeddedImageCount,
      uniqueImages: result.uniqueImageCount,
      assetKB: Math.round(result.assetBytes / 1024),
    }))
  );
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
