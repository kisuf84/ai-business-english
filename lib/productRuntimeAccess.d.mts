import type { LangslateProduct } from "./langslateDomains.mjs";
export type ProductRuntimeAccess = "wrong-host" | "unauthenticated" | "allow";
export function getProductRuntimeAccess(
  hostname: string | null | undefined,
  requestedProduct: LangslateProduct,
  authenticated: boolean
): ProductRuntimeAccess;
