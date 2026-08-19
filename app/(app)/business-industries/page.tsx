import CatalogPageShell from "../../../components/shared/CatalogPageShell";
import { listBusinessIndustriesItems } from "../../../lib/businessIndustries";
import BusinessIndustriesCatalog from "./BusinessIndustriesCatalog";

export default function BusinessIndustriesPage() {
  const items = listBusinessIndustriesItems();

  return (
    <CatalogPageShell
      eyebrow="Business Industries"
      title="Business Industries"
      description="61 industry-specific Business English tracks, each covering the vocabulary, expressions, and real-world scenarios of a distinct sector."
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
