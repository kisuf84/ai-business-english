import { notFound } from "next/navigation";
import CorporateSept14Landing from "../../../../components/corporate/CorporateSept14Landing";
import PublicProductLandingFrame from "../../../../components/products/PublicProductLandingFrame";
import type { LangslateProduct } from "../../../../lib/langslateDomains.mjs";
import { LANGSLATE_PRODUCTS } from "../../../../lib/langslateDomains.mjs";

type ProductLandingProps = {
  params: Promise<{ product: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProductLandingProps) {
  const { product } = await params;
  if (!Object.hasOwn(LANGSLATE_PRODUCTS, product)) return { title: "Langslate" };
  return { title: LANGSLATE_PRODUCTS[product as LangslateProduct].displayName };
}

export default async function ProductLandingPage({ params }: ProductLandingProps) {
  const { product } = await params;
  if (!Object.hasOwn(LANGSLATE_PRODUCTS, product)) notFound();

  if (product === "corporate") return <CorporateSept14Landing />;

  const landingProps: Record<Exclude<LangslateProduct, "corporate">, { src: string; title: string }> = {
    academy: { src: "/academy-landing-runtime.html", title: "Langslate Academy landing" },
    flow: { src: "/content/langslate-flow/landing", title: "Langslate Flow landing" },
    365: { src: "/content/langslate-365/landing", title: "Langslate 365 landing" },
  };

  const selected = landingProps[product as Exclude<LangslateProduct, "corporate">];
  return <PublicProductLandingFrame product={product as LangslateProduct} {...selected} />;
}
