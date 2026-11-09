import test from "node:test";
import assert from "node:assert/strict";
import {
  LANGSLATE_ADMIN_ORIGIN,
  LANGSLATE_PRODUCTS,
  buildAuthCallbackUrl,
  getAdminNavigationHref,
  getLangslateProductForHostname,
  getProductDomainRouteRedirect,
  isProductDomainApiRequest,
  getProductAuthHref,
  getProductLandingRewritePath,
  getProductNavigationHref,
  getProductShellMode,
} from "../lib/langslateDomains.mjs";
import { getOriginalHtmlWorkspace } from "../lib/productWorkspace.mjs";

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

test("product hostnames use the standalone shell while the main app keeps its AppShell", () => {
  for (const [hostname] of Object.values(expected)) {
    assert.equal(getProductShellMode(hostname), "standalone");
  }
  for (const hostname of ["ai-business-english.vercel.app", "langslate.co", "localhost:3000"]) {
    assert.equal(getProductShellMode(hostname), "main");
  }
});

test("the existing Flow and 365 HTML workspace files are selected without changing Corporate or Academy sources", () => {
  assert.deepEqual(getOriginalHtmlWorkspace("flow"), {
    src: "/content/langslate-flow/app",
    title: "Langslate Flow",
  });
  assert.deepEqual(getOriginalHtmlWorkspace("365"), {
    src: "/content/langslate-365/course",
    title: "Langslate 365",
  });
  assert.equal(getOriginalHtmlWorkspace("corporate"), null);
  assert.equal(getOriginalHtmlWorkspace("academy"), null);
});

test("each product domain keeps its own app routes and sends other product routes back to its root", () => {
  for (const [product, [hostname, , learningPath]] of Object.entries(expected)) {
    assert.equal(getProductDomainRouteRedirect(hostname, `/apps/${product}`), null);
    assert.equal(getProductDomainRouteRedirect(hostname, `/apps/${product}/platform`), null);
    assert.equal(getProductDomainRouteRedirect(hostname, learningPath), null);

    for (const [otherProduct] of Object.entries(expected)) {
      if (otherProduct === product) continue;
      assert.equal(getProductDomainRouteRedirect(hostname, `/apps/${otherProduct}`), "/");
      assert.equal(getProductDomainRouteRedirect(hostname, `/apps/${otherProduct}/platform`), "/");
      assert.equal(getProductDomainRouteRedirect(hostname, expected[otherProduct][2]), "/");
    }

    for (const mainAppPath of ["/dashboard", "/simulation", "/generator", "/settings"]) {
      assert.equal(getProductDomainRouteRedirect(hostname, mainAppPath), "/");
    }
  }
});

test("product domains retain shared auth/content/assets while main-app pages stay on the main host", () => {
  for (const [hostname] of Object.values(expected)) {
    for (const sharedPath of [
      "/auth",
      "/auth/callback?next=%2Fapps%2Fcorporate%2Fplatform",
      "/welcome?next=%2Fapps%2Facademy%2Fplatform",
      "/content/langslate-flow/landing",
      "/english-training-content/lesson.html",
      "/icons/english-training.png",
    ]) {
      assert.equal(getProductDomainRouteRedirect(hostname, new URL(sharedPath, "https://example.test").pathname), null);
    }
  }

  for (const mainHostname of ["langslate.co", "ai-business-english.vercel.app", "localhost:3000"]) {
    assert.equal(getProductDomainRouteRedirect(mainHostname, "/dashboard"), null);
    for (const [, , learningPath] of Object.values(expected)) {
      assert.equal(getProductDomainRouteRedirect(mainHostname, learningPath), null);
    }
    assert.equal(isProductDomainApiRequest(mainHostname, "/api/lesson/generate"), false);
  }
});

test("product domains deny the main application's API endpoints", () => {
  for (const [hostname] of Object.values(expected)) {
    assert.equal(isProductDomainApiRequest(hostname, "/api/lesson/generate"), true);
    assert.equal(isProductDomainApiRequest(hostname, "/api/admin/access"), true);
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

test("OAuth redirect_to requires an allowlist pattern that accepts its next query", () => {
  for (const [, [hostname, , learning]] of Object.entries(expected)) {
    const redirectTo = buildAuthCallbackUrl(`https://${hostname}`, learning);
    const exactPathAllowlistEntry = `https://${hostname}/auth/callback`;

    // Supabase matches redirect_to including its query string. An exact entry
    // for the path alone therefore does not match the URL sent by the client.
    assert.notEqual(redirectTo, exactPathAllowlistEntry);

    const parsed = new URL(redirectTo);
    assert.equal(parsed.origin, `https://${hostname}`);
    assert.equal(parsed.pathname, "/auth/callback");
    assert.equal(parsed.searchParams.get("next"), learning);
    assert.match(redirectTo, new RegExp(`^https://${hostname}/auth/callback\\?next=`));
  }
});

test("product navigation uses the destination domain without changing same-product or Vercel behavior", () => {
  assert.equal(getProductNavigationHref("academy", "/apps/academy", "langslatecorporate.com"), "https://langslateacademy.com/apps/academy");
  assert.equal(getProductNavigationHref("corporate", "/apps/corporate", "langslatecorporate.com"), "/apps/corporate");
  assert.equal(getProductNavigationHref("flow", "/apps/flow", "ai-business-english.vercel.app"), "/apps/flow");
  assert.equal(getAdminNavigationHref("langslateacademy.com"), `${LANGSLATE_ADMIN_ORIGIN}/admin`);
  assert.equal(getAdminNavigationHref("ai-business-english.vercel.app"), "/admin");
});
