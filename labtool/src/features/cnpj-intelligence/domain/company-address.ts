/**
 * CNPJ Intelligence — Company Address Domain Operations
 */

import type { CompanyAddress } from "./company.types";

/**
 * Formata um CEP de 8 dígitos para o padrão XXXXX-XXX.
 */
export function formatZipCode(cep: string | number | null | undefined): string {
  if (!cep) return "";
  const digits = String(cep).replace(/\D/g, "").padStart(8, "0").slice(0, 8);
  if (digits.length !== 8) return String(cep);
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Constrói a string consolidada de endereço a partir dos componentes estruturados.
 * Exemplo: "Av. Paulista, 1000, Sala 10 - Bela Vista, São Paulo - SP, CEP 01310-100"
 */
export function buildConsolidatedAddress(address?: CompanyAddress | null): string {
  if (!address) return "";

  const streetPart = [address.street, address.number].filter(Boolean).join(", ");
  const withComplement = [streetPart, address.complement].filter(Boolean).join(" - ");
  const withNeighborhood = [withComplement, address.neighborhood].filter(Boolean).join(", ");

  const cityState = [address.city, address.state].filter(Boolean).join(" - ");
  const withCityState = [withNeighborhood, cityState].filter(Boolean).join(", ");

  const formattedZip = address.zipCode ? `CEP ${formatZipCode(address.zipCode)}` : "";
  const full = [withCityState, formattedZip].filter(Boolean).join(", ");

  return full.trim();
}
