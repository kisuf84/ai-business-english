import ContentReaderPage from "../../../components/shared/ContentReaderPage";
import { getLevelTestItem } from "../../../lib/levelTest";

export default function LevelTestPage() {
  const item = getLevelTestItem();

  return (
    <ContentReaderPage
      eyebrow="Level Test"
      title={item.title}
      iframeSrc={`/content/level-test/${item.slug}`}
      backLinks={[{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
