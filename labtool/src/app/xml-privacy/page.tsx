import type { Metadata } from "next";
import { XmlPrivacyView } from "@/features/xml-privacy";

export const metadata: Metadata = {
  title: "XML Privacy — LabTools",
  description: "Sanitização e privacidade determinística e segura de documentos fiscais XML no navegador.",
};

export default function XmlPrivacyPage() {
  return <XmlPrivacyView />;
}
