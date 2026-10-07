import type { Metadata } from "next";
import { XmlSanitizerView } from "@/features/xml-sanitizer";

export const metadata: Metadata = {
  title: "XML Sanitizer — LabTools",
  description: "Sanitização e privacidade determinística e segura de documentos fiscais XML no navegador.",
};

export default function XmlSanitizerPage() {
  return <XmlSanitizerView />;
}
