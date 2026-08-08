import { promises as fs } from "fs";
import path from "path";

const ENGLISH_TRAINING_CONTENT_ROOT = path.join(
  process.cwd(),
  "english-training-content",
  "lessons"
);

export type EnglishTrainingCategory =
  | "General English Training"
  | "Business English Training"
  | "Business English Scenarios";

export type EnglishTrainingLesson = {
  id: string;
  slug: string;
  title: string;
  category: EnglishTrainingCategory;
  /** Original filename from the supplied source content, kept for traceability. */
  sourceFile: string;
};

/**
 * Manually curated catalog for the 35 supplied HTML lessons.
 * Source filenames use inconsistent casing/spacing across folders, so slugs
 * and titles are curated here rather than derived automatically. Titles are
 * taken from each file's own <title> tag, with the file's internal LEXICON /
 * MR. GAD branding trimmed for a clean catalog display name.
 */
const LESSONS: EnglishTrainingLesson[] = [
  // General English Training
  { id: "a1-english-foundations", slug: "a1-english-foundations", title: "A1 English Foundations", category: "General English Training", sourceFile: "a1_english_foundations.html" },
  { id: "a2-english-progress", slug: "a2-english-progress", title: "A2 English Progress", category: "General English Training", sourceFile: "a2_english_progress.html" },
  { id: "b1-english-fluency", slug: "b1-english-fluency", title: "B1 English Fluency", category: "General English Training", sourceFile: "b1_english_fluency.html" },
  { id: "b2-english-mastery", slug: "b2-english-mastery", title: "B2 English Mastery", category: "General English Training", sourceFile: "b2_english_mastery.html" },
  { id: "c1-english-mastery", slug: "c1-english-mastery", title: "C1 English Mastery", category: "General English Training", sourceFile: "c1_english_mastery.html" },

  // Business English Training
  { id: "business-english-training-1", slug: "business-english-training-1", title: "Premium Business English", category: "Business English Training", sourceFile: "business_english_training_1.html" },
  { id: "business-english-training-2", slug: "business-english-training-2", title: "Business English Vol. C–D", category: "Business English Training", sourceFile: "business_english_training_2.html" },
  { id: "business-english-training-3", slug: "business-english-training-3", title: "Business English Vol. E–F", category: "Business English Training", sourceFile: "business_english_training_3.html" },
  { id: "business-english-training-4", slug: "business-english-training-4", title: "Business English Vol. G–H", category: "Business English Training", sourceFile: "business_english_training_4.html" },
  { id: "business-english-training-5", slug: "business-english-training-5", title: "Business English Vol. I–J", category: "Business English Training", sourceFile: "business_english_training_5.html" },
  { id: "business-english-training-6", slug: "business-english-training-6", title: "Business English Vol. K–L", category: "Business English Training", sourceFile: "business_english_training_6.html" },
  { id: "business-english-training-7", slug: "business-english-training-7", title: "Business English Vol. M–N", category: "Business English Training", sourceFile: "business_english_training_7.html" },
  { id: "business-english-training-8", slug: "business-english-training-8", title: "Business English Vol. O–P", category: "Business English Training", sourceFile: "business_english_training_8.html" },
  { id: "business-english-training-9", slug: "business-english-training-9", title: "Business English Vol. Q–Z · The Final Volume", category: "Business English Training", sourceFile: "business_english_training_9.html" },
  { id: "business-english-training-10", slug: "business-english-training-10", title: "Business English · Advanced Scenarios Edition", category: "Business English Training", sourceFile: "business_english_training_10.html" },

  // Business English Scenarios
  { id: "banking-fintech-scenarios", slug: "banking-fintech-scenarios", title: "Banking, Fintech & Insurance Mastery", category: "Business English Scenarios", sourceFile: "Banking_Fintech_Scenarios.html" },
  { id: "business-challenges-scenarios", slug: "business-challenges-scenarios", title: "General Business Challenges Mastery", category: "Business English Scenarios", sourceFile: "Business_Challenges_Scenarios.html" },
  { id: "customer-service-scenarios", slug: "customer-service-scenarios", title: "Customer Service Mastery", category: "Business English Scenarios", sourceFile: "Customer_service_scenarios.html" },
  { id: "data-analytics-scenarios", slug: "data-analytics-scenarios", title: "Data, Analytics & Decision-Making Mastery", category: "Business English Scenarios", sourceFile: "Data_Analytics_Scenarios.html" },
  { id: "education-scenarios", slug: "education-scenarios", title: "Education & Training Business Mastery", category: "Business English Scenarios", sourceFile: "Education_Scenarios.html" },
  { id: "entrepreneurship-startup-scenarios", slug: "entrepreneurship-startup-scenarios", title: "Entrepreneurship & Startups Mastery", category: "Business English Scenarios", sourceFile: "Entrepreneurship_StartUp_Scenarios.html" },
  { id: "finance-operations-scenarios", slug: "finance-operations-scenarios", title: "Finance & Operations Mastery", category: "Business English Scenarios", sourceFile: "Finance_Operations_scenarios.html" },
  { id: "healthcare-scenarios", slug: "healthcare-scenarios", title: "Healthcare & Pharmaceuticals Mastery", category: "Business English Scenarios", sourceFile: "Healthcare_Scenarios.html" },
  { id: "human-resources-scenarios", slug: "human-resources-scenarios", title: "Human Resources & Talent Management Mastery", category: "Business English Scenarios", sourceFile: "Human Resources_Scenarios.html" },
  { id: "international-business-scenarios", slug: "international-business-scenarios", title: "International Business Mastery", category: "Business English Scenarios", sourceFile: "International-Business-Scenarios.html" },
  { id: "legal-compliance-scenarios", slug: "legal-compliance-scenarios", title: "Legal & Compliance Mastery", category: "Business English Scenarios", sourceFile: "Legal_Compliance-Scenarios.html" },
  { id: "management-leadership-scenarios", slug: "management-leadership-scenarios", title: "Management & Leadership Mastery", category: "Business English Scenarios", sourceFile: "management_leadership_scenarios.html" },
  { id: "marketing-branding-scenarios", slug: "marketing-branding-scenarios", title: "Marketing & Branding Mastery", category: "Business English Scenarios", sourceFile: "Marketing_Branding_Scenarios.html" },
  { id: "meetings-scenarios", slug: "meetings-scenarios", title: "Corporate Communication & Meetings Mastery", category: "Business English Scenarios", sourceFile: "Meetings_Scenarios.html" },
  { id: "retail-ecommerce-scenarios", slug: "retail-ecommerce-scenarios", title: "Retail, E-commerce & Consumer Business Mastery", category: "Business English Scenarios", sourceFile: "Retail_Ecommerce_scenarios.html" },
  { id: "sales-negotiation-scenarios", slug: "sales-negotiation-scenarios", title: "Sales & Negotiation Mastery", category: "Business English Scenarios", sourceFile: "sales_negotiation_scenarios.html" },
  { id: "scr-scenarios", slug: "scr-scenarios", title: "Sustainability & Corporate Responsibility Mastery", category: "Business English Scenarios", sourceFile: "SCR_Scenarios.html" },
  { id: "strategy-innovation-scenarios", slug: "strategy-innovation-scenarios", title: "Advanced Strategy & Innovation Mastery", category: "Business English Scenarios", sourceFile: "Strategy_Innovation_Scenarios.html" },
  { id: "supply-chain-scenarios", slug: "supply-chain-scenarios", title: "Supply Chain & Logistics Mastery", category: "Business English Scenarios", sourceFile: "Supply_Chain_Scenarios.html" },
  { id: "technology-digital-transformation-scenarios", slug: "technology-digital-transformation-scenarios", title: "Technology & Digital Transformation Mastery", category: "Business English Scenarios", sourceFile: "Technology_DigitalTransformation_Scenarios.html" },
];

export function listEnglishTrainingLessons(): EnglishTrainingLesson[] {
  return LESSONS;
}

export function getEnglishTrainingLesson(slug: string): EnglishTrainingLesson | null {
  return LESSONS.find((lesson) => lesson.slug === slug) ?? null;
}

/**
 * Resolves a lesson slug to its content file path on disk. Only slugs present
 * in the curated LESSONS table above are ever looked up, so this cannot be
 * used to traverse to an arbitrary filesystem path.
 */
export async function getEnglishTrainingLessonFilePath(slug: string) {
  const lesson = getEnglishTrainingLesson(slug);
  if (!lesson) return null;

  const filePath = path.join(ENGLISH_TRAINING_CONTENT_ROOT, `${lesson.slug}.html`);

  try {
    await fs.access(filePath);
  } catch {
    return null;
  }

  return { lesson, filePath };
}
