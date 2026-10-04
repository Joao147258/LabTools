/**
 * CNPJ Intelligence — Consult CNPJ Use Case
 *
 * Caso de uso orquestrador que:
 * 1. Normaliza e valida estritamente a entrada de CNPJ antes de qualquer chamada de rede;
 * 2. Invoca o gateway de dados cadastrais;
 * 3. Normaliza e higieniza a resposta recebida.
 */

import { normalizeCnpj, validateCnpj } from "../domain/cnpj";
import type { Company } from "../domain/company.types";
import type { CnpjGateway } from "./cnpj-gateway.interface";
import { CnpjConsultError } from "./cnpj-gateway.interface";
import { normalizeCompanyData } from "./normalize-company-data";

export interface ConsultCnpjParams {
  cnpj: string;
  gateway: CnpjGateway;
  signal?: AbortSignal;
}

export async function consultCnpjUseCase({
  cnpj,
  gateway,
  signal,
}: ConsultCnpjParams): Promise<Company> {
  const normalized = normalizeCnpj(cnpj);

  if (!normalized) {
    throw new CnpjConsultError("INVALID_CNPJ", "Informe um número de CNPJ para consulta.");
  }

  if (!validateCnpj(normalized)) {
    throw new CnpjConsultError("INVALID_CNPJ", "O CNPJ informado é inválido.");
  }

  const rawCompany = await gateway.findByCnpj(normalized, signal);
  return normalizeCompanyData(rawCompany);
}
