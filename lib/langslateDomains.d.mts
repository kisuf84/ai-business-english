export type LangslateProduct = "corporate" | "academy" | "flow" | "365";

export type LangslateProductConfig = {
  hostname: string;
  origin: string;
  displayName: string;
  landingPath: string;
  learningPath: string;
};

export const LANGSLATE_PRODUCTS: Readonly<Record<LangslateProduct, Readonly<LangslateProductConfig>>>;
export const LANGSLATE_ADMIN_ORIGIN: string;
export function normalizeHostname(value: string | null | undefined): string;
export function getLangslateProductForHostname(hostname: string | null | undefined): LangslateProduct | null;
export function getProductLandingRewritePath(hostname: string | null | undefined): string | null;
export function getProductLearningPath(product: LangslateProduct): string | null;
export function getProductAuthHref(product: LangslateProduct): string;
export function buildAuthCallbackUrl(origin: string, nextPath: string): string;
export function getProductNavigationHref(product: LangslateProduct, pathname: string, currentHostname: string | null | undefined): string;
export function getAdminNavigationHref(currentHostname: string | null | undefined): string;
