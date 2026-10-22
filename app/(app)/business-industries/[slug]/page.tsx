import { notFound } from "next/navigation";
import ContentReaderPage from "../../../../components/shared/ContentReaderPage";
import { getBusinessIndustriesItem } from "../../../../lib/businessIndustries";

export default async function BusinessIndustriesLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getBusinessIndustriesItem(slug);
  if (!item) {
    notFound();
  }

  return (
    <ContentReaderPage
      eyebrow="Business Industries"
      title={item.title}
      iframeSrc={`/content/business-industries/${item.slug}`}
      backLinks={[{ href: "/business-industries", label: "All Industries" }]}
    />
  );
}
