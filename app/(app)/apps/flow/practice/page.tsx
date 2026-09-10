import ContentReaderPage from "../../../../../components/shared/ContentReaderPage";
import { getLangslateFlowAppItem } from "../../../../../lib/langslateFlow";

export default function LangslateFlowPracticePage() {
  const item = getLangslateFlowAppItem();

  return (
    <ContentReaderPage
      eyebrow="Langslate Flow"
      title={item.title}
      description="Shadow Mode and Flow Mode conversation practice with voice feedback."
      iframeSrc={`/content/langslate-flow/${item.slug}`}
      backLinks={[
        { href: "/apps/flow", label: "Back to Langslate Flow" },
        { href: "/dashboard", label: "Back to Dashboard" },
      ]}
    />
  );
}
