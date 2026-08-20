import CatalogPageShell from "../../../components/shared/CatalogPageShell";
import {
  listBusinessIndustriesItems,
  BUSINESS_INDUSTRIES_HEADLINE,
  BUSINESS_INDUSTRIES_DESCRIPTION,
  BUSINESS_INDUSTRIES_CLOSING,
} from "../../../lib/businessIndustries";
import BusinessIndustriesCatalog from "./BusinessIndustriesCatalog";

export default function BusinessIndustriesPage() {
  const items = listBusinessIndustriesItems();

  return (
    <CatalogPageShell
      eyebrow="Business Industries"
      title="Business Industries"
      description={
        <>
          <strong className="text-[var(--ink)]">{BUSINESS_INDUSTRIES_HEADLINE}</strong>
          <br />
          <br />
          {BUSINESS_INDUSTRIES_DESCRIPTION}
          <br />
          <br />
          <strong className="text-[var(--ink)]">{BUSINESS_INDUSTRIES_CLOSING}</strong>
        </>
      }
    >
      <BusinessIndustriesCatalog
        items={items.map((item) => ({
          id: item.id,
          title: item.title,
          href: `/business-industries/${item.slug}`,
          thumbnailUrl: item.thumbnailUrl,
          fallbackLabel: "Business Industries",
          ctaLabel: "Start Training",
        }))}
      />
    </CatalogPageShell>
  );
}
