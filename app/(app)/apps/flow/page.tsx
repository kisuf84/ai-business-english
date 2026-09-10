import ContentReaderPage from "../../../../components/shared/ContentReaderPage";
import { getLangslateFlowLandingItem } from "../../../../lib/langslateFlow";

export default function LangslateFlowLandingPage() {
  const item = getLangslateFlowLandingItem();

  return (
    <ContentReaderPage
      eyebrow="Langslate Apps"
      title={item.title}
      description="Practice real conversations with an AI voice tutor. Speak with confidence."
      iframeSrc={`/content/langslate-flow/${item.slug}`}
      primaryAction={{ href: "/apps/flow/practice", label: "Open Langslate Flow" }}
      backLinks={[{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
