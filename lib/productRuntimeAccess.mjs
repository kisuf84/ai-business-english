import { getLangslateProductForHostname } from "./langslateDomains.mjs";

export function getProductRuntimeAccess(hostname, requestedProduct, authenticated) {
  const hostProduct = getLangslateProductForHostname(hostname);
  if (hostProduct !== requestedProduct) return "wrong-host";
  return authenticated ? "allow" : "unauthenticated";
}
