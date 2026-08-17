import ContentReaderPage from "../../../components/shared/ContentReaderPage";
import { getBizCompendiumItem } from "../../../lib/bizCompendium";

export default function BizCompendiumPage() {
  const item = getBizCompendiumItem();

  return (
    <ContentReaderPage
      eyebrow="Biz Compendium"
      title={item.title}
      description="Explore 5,000 Business English graded compendium of vocabulary, idiom, and register, drawn from the working life of the modern office."
      iframeSrc={`/content/biz-compendium/${item.slug}`}
      backLinks={[{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
