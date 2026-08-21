const THUMBNAIL_ROOT = "/business-industries-thumbnails";

/**
 * Exact client-provided copy, verbatim from "TAGLINES.pdf" (delivered
 * 2026-08-20 with the final Aug 19 icon package). Do not rewrite. Note the
 * "100 practical modules" figure does not match the 61 industries actually
 * imported below — reproduced as-is per explicit client instruction not to
 * reconcile the marketing copy against the current file count.
 */
export const BUSINESS_INDUSTRIES_HEADLINE = "Master the Language of Your Industry.";

export const BUSINESS_INDUSTRIES_DESCRIPTION =
  "Develop the English you need to succeed in today’s global workplace with 100 practical modules for every industry. Each module combines relevant industry-focused content with 10 auto-graded MCQs designed to test your understanding, reinforce key concepts, and build confidence in professional communication.";

export const BUSINESS_INDUSTRIES_CLOSING =
  "Learn your industry. Test your knowledge. Master Business English.";

export type BusinessIndustriesItem = {
  id: string;
  slug: string;
  title: string;
  sourceFile: string;
  thumbnailUrl: string;
};

type Seed = Omit<BusinessIndustriesItem, "thumbnailUrl">;

/** Curated from Aug 19 migration / brice_businessindustries{16,26,36,46,56,66}.
 * Flat catalog — source has no category/grouping metadata beyond the
 * industry name itself, so no sub-grouping is invented. Titles are the
 * industry name in Title Case (not each file's internal brand name, e.g.
 * "VELOCITAS" for Automotive) for consistency across all 61 cards. */
const SEEDS: Seed[] = [
  { id: "agribusiness", slug: "agribusiness", title: "Agribusiness", sourceFile: "agribusiness.html" },
  { id: "agriculture", slug: "agriculture", title: "Agriculture", sourceFile: "agriculture.html" },
  { id: "automotive", slug: "automotive", title: "Automotive", sourceFile: "automotive.html" },
  { id: "aviation", slug: "aviation", title: "Aviation", sourceFile: "aviation.html" },
  { id: "banking", slug: "banking", title: "Banking", sourceFile: "banking.html" },
  { id: "biotechnology", slug: "biotechnology", title: "Biotechnology", sourceFile: "biotechnology.html" },
  { id: "building-materials", slug: "building-materials", title: "Building Materials", sourceFile: "building-materials.html" },
  { id: "business-consulting", slug: "business-consulting", title: "Business Consulting", sourceFile: "business-consulting.html" },
  { id: "chemicals", slug: "chemicals", title: "Chemicals", sourceFile: "chemicals.html" },
  { id: "construction", slug: "construction", title: "Construction", sourceFile: "construction.html" },
  { id: "consumer-goods", slug: "consumer-goods", title: "Consumer Goods", sourceFile: "consumer-goods.html" },
  { id: "customer-service", slug: "customer-service", title: "Customer Service", sourceFile: "customer-service.html" },
  { id: "cybersecurity", slug: "cybersecurity", title: "Cybersecurity", sourceFile: "cybersecurity.html" },
  { id: "data-analytics", slug: "data-analytics", title: "Data Analytics", sourceFile: "data-analytics.html" },
  { id: "digital-marketing", slug: "digital-marketing", title: "Digital Marketing", sourceFile: "digital-marketing.html" },
  { id: "e-commerce", slug: "e-commerce", title: "E-Commerce", sourceFile: "e-commerce.html" },
  { id: "education", slug: "education", title: "Education", sourceFile: "education.html" },
  { id: "energy", slug: "energy", title: "Energy", sourceFile: "energy.html" },
  { id: "engineering", slug: "engineering", title: "Engineering", sourceFile: "engineering.html" },
  { id: "entertainment", slug: "entertainment", title: "Entertainment", sourceFile: "entertainment.html" },
  { id: "environment", slug: "environment", title: "Environment", sourceFile: "environment.html" },
  { id: "event-management", slug: "event-management", title: "Event Management", sourceFile: "event-management.html" },
  { id: "fashion", slug: "fashion", title: "Fashion", sourceFile: "fashion.html" },
  { id: "finance", slug: "finance", title: "Finance", sourceFile: "finance.html" },
  { id: "food-and-beverage", slug: "food-and-beverage", title: "Food & Beverage", sourceFile: "food-and-beverage.html" },
  { id: "government", slug: "government", title: "Government", sourceFile: "government.html" },
  { id: "healthcare", slug: "healthcare", title: "Healthcare", sourceFile: "healthcare.html" },
  { id: "hospitality", slug: "hospitality", title: "Hospitality", sourceFile: "hospitality.html" },
  { id: "human-resources", slug: "human-resources", title: "Human Resources", sourceFile: "human-resources.html" },
  { id: "it", slug: "it", title: "IT", sourceFile: "it.html" },
  { id: "import-and-export", slug: "import-and-export", title: "Import & Export", sourceFile: "import-and-export.html" },
  { id: "insurance", slug: "insurance", title: "Insurance", sourceFile: "insurance.html" },
  { id: "interior-design", slug: "interior-design", title: "Interior Design", sourceFile: "interior-design.html" },
  { id: "international-trade", slug: "international-trade", title: "International Trade", sourceFile: "international-trade.html" },
  { id: "journalism", slug: "journalism", title: "Journalism", sourceFile: "journalism.html" },
  { id: "legal-services", slug: "legal-services", title: "Legal Services", sourceFile: "legal-services.html" },
  { id: "logistics", slug: "logistics", title: "Logistics", sourceFile: "logistics.html" },
  { id: "manufacturing", slug: "manufacturing", title: "Manufacturing", sourceFile: "manufacturing.html" },
  { id: "marketing", slug: "marketing", title: "Marketing", sourceFile: "marketing.html" },
  { id: "media", slug: "media", title: "Media", sourceFile: "media.html" },
  { id: "mining", slug: "mining", title: "Mining", sourceFile: "mining.html" },
  { id: "nonprofit", slug: "nonprofit", title: "Nonprofit", sourceFile: "nonprofit.html" },
  { id: "oil-and-gas", slug: "oil-and-gas", title: "Oil & Gas", sourceFile: "oil-and-gas.html" },
  { id: "pharmaceutical", slug: "pharmaceutical", title: "Pharmaceutical", sourceFile: "pharmaceutical.html" },
  { id: "public-relations", slug: "public-relations", title: "Public Relations", sourceFile: "public-relations.html" },
  { id: "real-estate", slug: "real-estate", title: "Real Estate", sourceFile: "real-estate.html" },
  { id: "recruitment", slug: "recruitment", title: "Recruitment", sourceFile: "recruitment.html" },
  { id: "retail", slug: "retail", title: "Retail", sourceFile: "retail.html" },
  { id: "sales", slug: "sales", title: "Sales", sourceFile: "sales.html" },
  { id: "security", slug: "security", title: "Security", sourceFile: "security.html" },
  { id: "shipping", slug: "shipping", title: "Shipping", sourceFile: "shipping.html" },
  { id: "social-media", slug: "social-media", title: "Social Media", sourceFile: "social-media.html" },
  { id: "software-dev", slug: "software-dev", title: "Software Dev", sourceFile: "software-dev.html" },
  { id: "sports-management", slug: "sports-management", title: "Sports Management", sourceFile: "sports-management.html" },
  { id: "telecommunications", slug: "telecommunications", title: "Telecommunications", sourceFile: "telecommunications.html" },
  { id: "tourism", slug: "tourism", title: "Tourism", sourceFile: "tourism.html" },
  { id: "trading", slug: "trading", title: "Trading", sourceFile: "trading.html" },
  { id: "transportation", slug: "transportation", title: "Transportation", sourceFile: "transportation.html" },
  { id: "travel", slug: "travel", title: "Travel", sourceFile: "travel.html" },
  { id: "utilities", slug: "utilities", title: "Utilities", sourceFile: "utilities.html" },
  { id: "wholesale", slug: "wholesale", title: "Wholesale", sourceFile: "wholesale.html" },
];

const ITEMS: BusinessIndustriesItem[] = SEEDS.map((item) => ({
  ...item,
  thumbnailUrl: `${THUMBNAIL_ROOT}/${item.slug}.jpg`,
}));

export function listBusinessIndustriesItems(): BusinessIndustriesItem[] {
  return ITEMS;
}

export function getBusinessIndustriesItem(slug: string): BusinessIndustriesItem | null {
  return ITEMS.find((item) => item.slug === slug) ?? null;
}
