import test from "node:test";
import assert from "node:assert/strict";
import {
  LANGSLATE_ADMIN_ORIGIN,
  LANGSLATE_PRODUCTS,
  buildAuthCallbackUrl,
  getAdminNavigationHref,
  getLangslateProductForHostname,
  getProductAuthHref,
  getProductLandingRewritePath,
  getProductNavigationHref,
} from "../lib/langslateDomains.mjs";

const expected = {
  corporate: ["langslatecorporate.com", "/product-home/corporate", "/apps/corporate/platform"],
  academy: ["langslateacademy.com", "/product-home/academy", "/apps/academy/platform"],
  flow: ["langslateflow.com", "/product-home/flow", "/apps/flow/practice"],
  365: ["langslate365.com", "/product-home/365", "/apps/365/course"],
};

test("each exact product hostname maps its root to the public landing route", () => {
  for (const [product, [hostname, landing, learning]] of Object.entries(expected)) {
    assert.equal(getLangslateProductForHostname(hostname), product);
    assert.equal(getProductLandingRewritePath(hostname), landing);
    assert.equal(LANGSLATE_PRODUCTS[product].learningPath, learning);
  }
});

test("unknown, local, and existing Vercel hostnames retain the existing root", () => {
  for (const hostname of ["localhost:3000", "ai-business-english.vercel.app", "unknown.example.com", "www.langslateflow.com"]) {
    assert.equal(getLangslateProductForHostname(hostname), null);
    assert.equal(getProductLandingRewritePath(hostname), null);
  }
});

test("product login entries return to the matching learning route", () => {
  for (const [product, [, , learning]] of Object.entries(expected)) {
    const url = new URL(getProductAuthHref(product), "https://example.test");
    assert.equal(url.pathname, "/auth");
    assert.equal(url.searchParams.get("next"), learning);
  }
});

test("OAuth callback URL stays on the initiating domain and preserves a deep link", () => {
  const deepLink = "/apps/corporate/professions/finance/lesson-1?mode=review#exercise-2";
  for (const [, [hostname]] of Object.entries(expected)) {
    const callback = new URL(buildAuthCallbackUrl(`https://${hostname}`, deepLink));
    assert.equal(callback.origin, `https://${hostname}`);
    assert.equal(callback.pathname, "/auth/callback");
    assert.equal(callback.searchParams.get("next"), deepLink);
  }
});

test("product navigation uses the destination domain without changing same-product or Vercel behavior", () => {
  assert.equal(getProductNavigationHref("academy", "/apps/academy", "langslatecorporate.com"), "https://langslateacademy.com/apps/academy");
  assert.equal(getProductNavigationHref("corporate", "/apps/corporate", "langslatecorporate.com"), "/apps/corporate");
  assert.equal(getProductNavigationHref("flow", "/apps/flow", "ai-business-english.vercel.app"), "/apps/flow");
  assert.equal(getAdminNavigationHref("langslateacademy.com"), `${LANGSLATE_ADMIN_ORIGIN}/admin`);
  assert.equal(getAdminNavigationHref("ai-business-english.vercel.app"), "/admin");
});
