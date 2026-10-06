import type { Metadata } from "next";
import AcademyLanding from "../../../../components/academy/AcademyLanding";
import { countAcademyLessons } from "../../../../lib/langslateAcademy";

export const metadata: Metadata = {
  title: "Langslate Academy",
  description: `${countAcademyLessons()} structured English lessons across A0, A1, A2, B1, B2, and C1.`,
};

export const dynamic = "force-dynamic";

export default function LangslateAcademyPage() {
  return <AcademyLanding />;
}
