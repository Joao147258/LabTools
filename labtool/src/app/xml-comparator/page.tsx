import type { Metadata } from "next";
import { XmlComparatorView } from "@/features/xml-comparator";

export const metadata: Metadata = {
  title: "XML Comparator — LabTools",
  description: "Comparação estrutural profunda e visualização side-by-side de documentos XML fiscais.",
};

export default function XmlComparatorPage() {
  return <XmlComparatorView />;
}
