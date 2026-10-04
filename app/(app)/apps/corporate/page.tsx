import type { Metadata } from "next";
import CorporateSept14Landing from "../../../../components/corporate/CorporateSept14Landing";

export const metadata: Metadata = {
  title: "Langslate Corporate — Master Business English",
  description: "Business English designed around your profession, industry, and career.",
};

export default function LangslateCorporatePage() {
  return <CorporateSept14Landing />;
}
