import type { Metadata } from "next";
import AcademyPlatform from "../../../../../components/academy/AcademyPlatform";
import { countAcademyLessons, listAcademyRuntimeLevels } from "../../../../../lib/langslateAcademy";
import { normalizeLangslateContentBaseUrl } from "../../../../../lib/langslateContent";

const PROTOTYPE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;800;900&display=swap";
const FONT_AWESOME_HREF = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";

export const metadata: Metadata = {
  title: "Langslate Academy Platform",
  description: `${countAcademyLessons()} structured English lessons across A0, A1, A2, B1, B2, and C1.`,
};

export const dynamic = "force-dynamic";

export default function LangslateAcademyPlatformPage() {
  const contentBaseUrl = normalizeLangslateContentBaseUrl(process.env.LANGSLATE_CONTENT_BASE_URL);
  const levels = listAcademyRuntimeLevels(contentBaseUrl);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={PROTOTYPE_FONTS_HREF} />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={FONT_AWESOME_HREF} />
      <AcademyPlatform levels={levels} />
    </>
  );
}
