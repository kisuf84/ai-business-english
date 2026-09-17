import ContentReaderPage from "../../../../components/shared/ContentReaderPage";
import { getLangslate365LandingItem } from "../../../../lib/langslate365";

export default function Langslate365LandingPage() {
  const item = getLangslate365LandingItem();

  return (
    <ContentReaderPage
      eyebrow="Langslate Apps"
      title={item.title}
      description="5 minutes a day, 365 days a year of business English mastery."
      iframeSrc={`/content/langslate-365/${item.slug}`}
      primaryAction={{ href: "/apps/365/course", label: "Open the App" }}
      backLinks={[{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
