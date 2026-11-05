import { headers } from "next/headers";
import ContentReaderPage from "../../../../components/shared/ContentReaderPage";
import { getLangslate365LandingItem } from "../../../../lib/langslate365";
import { getLangslateProductForHostname } from "../../../../lib/langslateDomains.mjs";

export default async function Langslate365LandingPage() {
  const product = getLangslateProductForHostname((await headers()).get("host"));
  const item = getLangslate365LandingItem();

  return (
    <ContentReaderPage
      eyebrow={product ? "Langslate 365" : "Langslate Apps"}
      title={item.title}
      description="5 minutes a day, 365 days a year of business English mastery."
      iframeSrc={`/content/langslate-365/${item.slug}`}
      primaryAction={{ href: "/apps/365/course", label: "Open the App" }}
      backLinks={product ? [] : [{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
