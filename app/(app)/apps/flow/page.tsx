import { headers } from "next/headers";
import ContentReaderPage from "../../../../components/shared/ContentReaderPage";
import { getLangslateFlowLandingItem } from "../../../../lib/langslateFlow";
import { getLangslateProductForHostname } from "../../../../lib/langslateDomains.mjs";

export default async function LangslateFlowLandingPage() {
  const product = getLangslateProductForHostname((await headers()).get("host"));
  const item = getLangslateFlowLandingItem();

  return (
    <ContentReaderPage
      eyebrow={product ? "Langslate Flow" : "Langslate Apps"}
      title={item.title}
      description="Practice real conversations with an AI voice tutor. Speak with confidence."
      iframeSrc={`/content/langslate-flow/${item.slug}`}
      primaryAction={{ href: "/apps/flow/practice", label: "Open Langslate Flow" }}
      backLinks={product ? [] : [{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
