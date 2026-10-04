/**
 * CNPJ Intelligence — Company Entity Domain Functions
 */

import type { Company, CompanyTaxRegime, RegistrationStatus } from "./company.types";
import { formatCnpj, normalizeCnpj } from "./cnpj";
import { buildConsolidatedAddress } from "./company-address";

/**
 * Converte códigos ou descrições numéricas/textuais para o status cadastral padrão.
 */
export function normalizeRegistrationStatus(
  status: string | number | null | undefined
): RegistrationStatus {
  if (status === null || status === undefined) return "DESCONHECIDA";

  const str = String(status).trim().toUpperCase();

  if (str === "2" || str === "ATIVA" || str.includes("ATIVA")) return "ATIVA";
  if (str === "8" || str === "BAIXADA" || str.includes("BAIXADA")) return "BAIXADA";
  if (str === "4" || str === "INAPTA" || str.includes("INAPTA")) return "INAPTA";
  if (str === "3" || str === "SUSPENSA" || str.includes("SUSPENSA")) return "SUSPENSA";
  if (str === "1" || str === "NULA" || str.includes("NULA")) return "NULA";

  return "DESCONHECIDA";
}

/**
 * Formata um valor numérico para o padrão de moeda brasileira (R$ 0.000,00).
 */
export function formatCurrencyBrl(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "R$ 0,00";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Converte data ISO (ex: YYYY-MM-DD) para formato legível brasileiro (DD/MM/YYYY).
 */
export function formatDateIsoToBr(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const clean = dateStr.trim();
  // Se já estiver em formato DD/MM/YYYY, retorna direto
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) return clean;

  const parts = clean.split("T")[0].split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (year.length === 4 && month.length === 2 && day.length === 2) {
      return `${day}/${month}/${year}`;
    }
  }
  return clean;
}

/**
 * Cria e formata a estrutura de regime tributário da empresa com base nas opções de Simples e MEI.
 */
export function buildTaxRegime(params: {
  isSimples?: boolean | null;
  simplesOptDate?: string | null;
  simplesExcludedDate?: string | null;
  isMei?: boolean | null;
  meiOptDate?: string | null;
  meiExcludedDate?: string | null;
  customName?: string | null;
}): CompanyTaxRegime {
  const isMei = Boolean(params.isMei);
  const isSimples = Boolean(params.isSimples);

  const simplesOptDate = formatDateIsoToBr(params.simplesOptDate) || undefined;
  const simplesExcludedDate = formatDateIsoToBr(params.simplesExcludedDate) || undefined;
  const meiOptDate = formatDateIsoToBr(params.meiOptDate) || undefined;
  const meiExcludedDate = formatDateIsoToBr(params.meiExcludedDate) || undefined;

  let name = typeof params.customName === "string" ? params.customName.trim() : "";

  if (!name) {
    if (isMei) {
      name = "Microempreendedor Individual (MEI)";
    } else if (isSimples) {
      name = "Simples Nacional";
    } else if (params.isSimples === false || params.isMei === false || simplesExcludedDate || meiExcludedDate) {
      name = "Não Optante pelo Simples Nacional";
    } else {
      name = "Regime Normal (Lucro Presumido / Real / Outros)";
    }
  }

  let details: string | undefined;
  if (isMei && meiOptDate) {
    details = `Optante pelo MEI desde ${meiOptDate}`;
  } else if (isSimples && simplesOptDate) {
    details = `Optante pelo Simples desde ${simplesOptDate}`;
  } else if (simplesExcludedDate) {
    details = `Excluído do Simples em ${simplesExcludedDate}`;
  } else if (meiExcludedDate) {
    details = `Excluído do MEI em ${meiExcludedDate}`;
  }

  return {
    name,
    isSimplesNacional: isSimples,
    simplesOptDate,
    simplesExcludedDate,
    isMei,
    meiOptDate,
    meiExcludedDate,
    details,
  };
}

/**
 * Garante que a entidade Company possua campos calculados e higienizados.
 */
export function sanitizeCompanyEntity(company: Partial<Company> & { cnpj: string; legalName: string }): Company {
  const normCnpj = normalizeCnpj(company.cnpj);
  const formattedCnpj = formatCnpj(normCnpj);
  const status = normalizeRegistrationStatus(company.registrationStatus);

  const formattedShareCapital =
    company.shareCapital !== undefined ? formatCurrencyBrl(company.shareCapital) : undefined;

  const address = company.address
    ? {
        ...company.address,
        formattedAddress: company.address.formattedAddress || buildConsolidatedAddress(company.address),
      }
    : undefined;

  return {
    cnpj: normCnpj,
    formattedCnpj,
    legalName: company.legalName.trim(),
    tradeName: company.tradeName?.trim() || undefined,
    registrationStatus: status,
    registrationStatusRaw: company.registrationStatusRaw || String(company.registrationStatus || ""),
    registrationStatusDate: formatDateIsoToBr(company.registrationStatusDate) || undefined,
    registrationStatusReason: company.registrationStatusReason?.trim() || undefined,
    specialStatus: company.specialStatus?.trim() || undefined,
    specialStatusDate: formatDateIsoToBr(company.specialStatusDate) || undefined,
    openingDate: formatDateIsoToBr(company.openingDate) || undefined,
    legalNature: company.legalNature,
    companySize: company.companySize?.trim() || undefined,
    shareCapital: company.shareCapital,
    formattedShareCapital,
    taxRegime: company.taxRegime,
    address,
    primaryActivity: company.primaryActivity,
    secondaryActivities: company.secondaryActivities || [],
    partners: company.partners || [],
  };
}
