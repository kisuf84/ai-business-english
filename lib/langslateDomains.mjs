export const LANGSLATE_PRODUCTS = Object.freeze({
  corporate: Object.freeze({
    hostname: "langslatecorporate.com",
    origin: "https://langslatecorporate.com",
    displayName: "Langslate Corporate",
    landingPath: "/apps/corporate",
    learningPath: "/apps/corporate/platform",
  }),
  academy: Object.freeze({
    hostname: "langslateacademy.com",
    origin: "https://langslateacademy.com",
    displayName: "Langslate Academy",
    landingPath: "/apps/academy",
    learningPath: "/apps/academy/platform",
  }),
  flow: Object.freeze({
    hostname: "langslateflow.com",
    origin: "https://langslateflow.com",
    displayName: "Langslate Flow",
    landingPath: "/apps/flow",
    learningPath: "/apps/flow/practice",
  }),
  365: Object.freeze({
    hostname: "langslate365.com",
    origin: "https://langslate365.com",
    displayName: "Langslate 365",
    landingPath: "/apps/365",
    learningPath: "/apps/365/course",
  }),
});

export const LANGSLATE_ADMIN_ORIGIN = "https://ai-business-english.vercel.app";

export function normalizeHostname(value) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

export function getLangslateProductForHostname(hostname) {
  const normalized = normalizeHostname(hostname);
  return Object.keys(LANGSLATE_PRODUCTS).find(
    (product) => LANGSLATE_PRODUCTS[product].hostname === normalized
  ) || null;
}

export function getProductLandingRewritePath(hostname) {
  const product = getLangslateProductForHostname(hostname);
  return product ? `/product-home/${product}` : null;
}

export function getProductLearningPath(product) {
  return LANGSLATE_PRODUCTS[product]?.learningPath || null;
}

export function getProductAuthHref(product) {
  const learningPath = getProductLearningPath(product);
  return learningPath ? `/auth?next=${encodeURIComponent(learningPath)}` : "/auth";
}

export function buildAuthCallbackUrl(origin, nextPath) {
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", nextPath);
  return callback.toString();
}

export function getProductNavigationHref(product, pathname, currentHostname) {
  const productConfig = LANGSLATE_PRODUCTS[product];
  if (!productConfig) return pathname;

  const currentProduct = getLangslateProductForHostname(currentHostname);
  if (!currentProduct || currentProduct === product) return pathname;
  return `${productConfig.origin}${pathname}`;
}

export function getAdminNavigationHref(currentHostname) {
  return getLangslateProductForHostname(currentHostname)
    ? `${LANGSLATE_ADMIN_ORIGIN}/admin`
    : "/admin";
}
