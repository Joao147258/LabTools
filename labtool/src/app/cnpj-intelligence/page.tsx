import type { Metadata } from "next";
import { Suspense } from "react";
import { CnpjIntelligenceView } from "@/features/cnpj-intelligence";

export const metadata: Metadata = {
  title: "CNPJ Intelligence — LabTools",
  description: "Consulta técnica cadastral, situação fiscal e estrutura societária de empresas.",
};

interface PageProps {
  searchParams: Promise<{ cnpj?: string }>;
}

async function CnpjContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialCnpj = params?.cnpj || "";
  return <CnpjIntelligenceView initialCnpj={initialCnpj} />;
}

export default function CnpjIntelligencePage(props: PageProps) {
  return (
    <Suspense fallback={null}>
      <CnpjContent searchParams={props.searchParams} />
    </Suspense>
  );
}
