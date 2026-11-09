import { headers } from "next/headers";
import ContentReaderPage from "../../../../../components/shared/ContentReaderPage";
import { ProductExperienceFrame } from "../../../../../components/shared/ProductExperienceFrame";
import { getLangslateProductForHostname } from "../../../../../lib/langslateDomains.mjs";
import { getLangslateFlowAppItem } from "../../../../../lib/langslateFlow";
import { getOriginalHtmlWorkspace } from "../../../../../lib/productWorkspace.mjs";

export default async function LangslateFlowPracticePage() {
  const product = getLangslateProductForHostname((await headers()).get("host"));
  const workspace = getOriginalHtmlWorkspace("flow");
  if (product) return workspace ? <ProductExperienceFrame {...workspace} /> : null;
  const item = getLangslateFlowAppItem();
  return (
    <ContentReaderPage
      eyebrow="Langslate Flow"
      title={item.title}
      description="Shadow Mode and Flow Mode conversation practice with voice feedback."
      iframeSrc={`/content/langslate-flow/${item.slug}`}
      backLinks={[{ href: "/apps/flow", label: "Back to Langslate Flow" }, { href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
