/**
 * CNPJ Intelligence — Domain Types
 *
 * Tipos e contratos de domínio puros para CNPJ e modelos empresariais cadastrais.
 * Não possui dependências de bibliotecas de terceiros, React ou APIs externas.
 */

export type RegistrationStatus =
  | "ATIVA"
  | "BAIXADA"
  | "INAPTA"
  | "SUSPENSA"
  | "NULA"
  | "DESCONHECIDA";

export interface LegalNature {
  code?: string;
  description?: string;
}

export interface CompanyAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  formattedAddress?: string;
}

export interface CompanyActivity {
  code: string;
  description: string;
}

export interface LegalRepresentative {
  name?: string;
  qualification?: string;
}

export interface CompanyPartner {
  name: string;
  qualification?: string;
  entryDate?: string;
  ageRange?: string;
  legalRepresentative?: LegalRepresentative;
}

export interface CompanyTaxRegime {
  name: string;
  isSimplesNacional?: boolean;
  simplesOptDate?: string;
  simplesExcludedDate?: string;
  isMei?: boolean;
  meiOptDate?: string;
  meiExcludedDate?: string;
  details?: string;
}

export interface Company {
  cnpj: string;
  formattedCnpj: string;
  legalName: string;
  tradeName?: string;
  registrationStatus: RegistrationStatus | string;
  registrationStatusRaw?: string;
  registrationStatusDate?: string;
  registrationStatusReason?: string;
  specialStatus?: string;
  specialStatusDate?: string;
  openingDate?: string;
  legalNature?: LegalNature;
  companySize?: string;
  shareCapital?: number;
  formattedShareCapital?: string;
  taxRegime?: CompanyTaxRegime;
  address?: CompanyAddress;
  primaryActivity?: CompanyActivity;
  secondaryActivities?: CompanyActivity[];
  partners?: CompanyPartner[];
}
