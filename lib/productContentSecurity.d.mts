export type ProductContentApp = "flow" | "365";
export type ProductContentAccess = "allow" | "unauthenticated" | "wrong-host";

export function getProtectedProductContentDocument(library: string, slug: string): ProductContentApp | null;
export function getProductContentDocumentAccess(
  hostname: string | null | undefined,
  requestedProduct: ProductContentApp,
  authenticated: boolean,
): ProductContentAccess;
export function injectProductSignOutControl(html: string, product: ProductContentApp): string;
