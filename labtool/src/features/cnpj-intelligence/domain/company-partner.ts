/**
 * CNPJ Intelligence — Company Partner Domain Operations (QSA)
 */

import type { CompanyPartner, LegalRepresentative } from "./company.types";

/**
 * Cria um objeto CompanyPartner sanitizado a partir de dados brutos da sociedade.
 */
export function createCompanyPartner(params: {
  name: string | null | undefined;
  qualification?: string | null;
  entryDate?: string | null;
  ageRange?: string | null;
  legalRepresentativeName?: string | null;
  legalRepresentativeQualification?: string | null;
}): CompanyPartner | null {
  const cleanName = (params.name || "").trim();
  if (!cleanName) return null;

  let legalRepresentative: LegalRepresentative | undefined;
  const repName = (params.legalRepresentativeName || "").trim();
  const repQual = (params.legalRepresentativeQualification || "").trim();

  if (repName || repQual) {
    legalRepresentative = {
      name: repName || undefined,
      qualification: repQual || undefined,
    };
  }

  return {
    name: cleanName,
    qualification: (params.qualification || "").trim() || undefined,
    entryDate: (params.entryDate || "").trim() || undefined,
    ageRange: (params.ageRange || "").trim() || undefined,
    legalRepresentative,
  };
}
