import CatalogPageShell from "../../../components/shared/CatalogPageShell";
import ContentCatalogSections from "../../../components/shared/ContentCatalogSections";
import {
  listGossipEnglishItems,
  GOSSIP_ENGLISH_LEVEL_ORDER,
  GOSSIP_ENGLISH_HEADLINE,
  GOSSIP_ENGLISH_DESCRIPTION,
  GOSSIP_ENGLISH_CLOSING,
} from "../../../lib/gossipEnglish";

export default function GossipEnglishPage() {
  const items = listGossipEnglishItems();

  return (
    <CatalogPageShell
      eyebrow="Gossip English"
      title="Gossip English"
      description={
        <>
          <strong className="text-[var(--ink)]">{GOSSIP_ENGLISH_HEADLINE}</strong>
          <br />
          <br />
          {GOSSIP_ENGLISH_DESCRIPTION}
          <br />
          <br />
          <strong className="text-[var(--ink)]">{GOSSIP_ENGLISH_CLOSING}</strong>
        </>
      }
    >
      <ContentCatalogSections
        groups={GOSSIP_ENGLISH_LEVEL_ORDER.map((level) => ({
          key: level,
          label: level,
          items: items
            .filter((item) => item.level === level)
            .map((item) => ({
              id: item.id,
              title: item.title,
              href: `/gossip-english/${item.slug}`,
              thumbnailUrl: item.thumbnailUrl,
              fallbackLabel: item.level,
              ctaLabel: "Start Reading",
            })),
        }))}
      />
    </CatalogPageShell>
  );
}
