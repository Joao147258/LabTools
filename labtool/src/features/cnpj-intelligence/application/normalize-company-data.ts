/**
 * CNPJ Intelligence — Application Use Case: Normalize Company Data
 *
 * Aplica regras defensivas de normalização sobre os dados da empresa.
 */

import type { Company } from "../domain";
import { sanitizeCompanyEntity } from "../domain";

export function normalizeCompanyData(company: Company): Company {
  return sanitizeCompanyEntity(company);
}
