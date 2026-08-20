import ContentReaderPage from "../../../components/shared/ContentReaderPage";
import {
  getLevelTestItem,
  LEVEL_TEST_HEADLINE,
  LEVEL_TEST_DESCRIPTION,
  LEVEL_TEST_CLOSING,
} from "../../../lib/levelTest";

export default function LevelTestPage() {
  const item = getLevelTestItem();

  return (
    <ContentReaderPage
      eyebrow="Level Test"
      title={item.title}
      description={
        <>
          <strong className="text-[var(--ink)]">{LEVEL_TEST_HEADLINE}</strong>
          <br />
          {LEVEL_TEST_DESCRIPTION}
          <br />
          <strong className="text-[var(--ink)]">{LEVEL_TEST_CLOSING}</strong>
        </>
      }
      iframeSrc={`/content/level-test/${item.slug}`}
      backLinks={[{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
