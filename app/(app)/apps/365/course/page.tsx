import ContentReaderPage from "../../../../../components/shared/ContentReaderPage";
import { getLangslate365CourseItem } from "../../../../../lib/langslate365";

export default function Langslate365CoursePage() {
  const item = getLangslate365CourseItem();

  return (
    <ContentReaderPage
      eyebrow="Langslate 365"
      title={item.title}
      description="365 daily business English lessons, 5 minutes each."
      iframeSrc={`/content/langslate-365/${item.slug}`}
      backLinks={[
        { href: "/apps/365", label: "Back to Langslate 365" },
        { href: "/dashboard", label: "Back to Dashboard" },
      ]}
    />
  );
}
