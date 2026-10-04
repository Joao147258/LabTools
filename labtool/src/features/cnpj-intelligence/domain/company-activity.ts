/**
 * CNPJ Intelligence — Company Economic Activities Domain Operations
 */

import type { CompanyActivity } from "./company.types";

/**
 * Formata um código CNAE (7 dígitos) no formato oficial: 0000-0/00.
 * Exemplo: "6201501" -> "6201-5/01"
 */
export function formatCnae(code: string | number | null | undefined): string {
  if (!code) return "";
  const digits = String(code).replace(/\D/g, "");
  if (digits.length === 7) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5, 7)}`;
  }
  return String(code).trim();
}

/**
 * Cria um objeto CompanyActivity sanitizado.
 */
export function createCompanyActivity(
  code: string | number | null | undefined,
  description: string | null | undefined
): CompanyActivity {
  return {
    code: formatCnae(code),
    description: (description || "").trim(),
  };
}
