import ContentReaderPage from "../../../components/shared/ContentReaderPage";
import { getBizCompendiumItem } from "../../../lib/bizCompendium";

export default function BizCompendiumPage() {
  const item = getBizCompendiumItem();

  return (
    <ContentReaderPage
      eyebrow="Biz Compendium"
      title={item.title}
      iframeSrc={`/content/biz-compendium/${item.slug}`}
      backLinks={[{ href: "/dashboard", label: "Back to Dashboard" }]}
    />
  );
}
