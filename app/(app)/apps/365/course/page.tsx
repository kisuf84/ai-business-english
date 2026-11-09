import { headers } from "next/headers";
import ContentReaderPage from "../../../../../components/shared/ContentReaderPage";
import { ProductExperienceFrame } from "../../../../../components/shared/ProductExperienceFrame";
import { getLangslateProductForHostname } from "../../../../../lib/langslateDomains.mjs";
import { getLangslate365CourseItem } from "../../../../../lib/langslate365";
import { getOriginalHtmlWorkspace } from "../../../../../lib/productWorkspace.mjs";

export default async function Langslate365CoursePage() {
  const product = getLangslateProductForHostname((await headers()).get("host"));
  const workspace = getOriginalHtmlWorkspace("365");
  if (product) return workspace ? <ProductExperienceFrame {...workspace} /> : null;
  const item = getLangslate365CourseItem();
  return (
    <ContentReaderPage
      eyebrow="Langslate 365"
      title={item.title}
      description="365 daily business English lessons, 5 minutes each."
      iframeSrc={`/content/langslate-365/${item.slug}`}
      backLinks={[{ href: "/apps/365", label: "Back to Langslate 365" }, { href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
