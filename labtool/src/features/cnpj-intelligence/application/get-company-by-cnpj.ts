/**
 * CNPJ Intelligence — Application Use Case: Get Company By CNPJ
 */

import type { Company } from "../domain";
import type { CnpjGateway } from "./cnpj-gateway.interface";
import { consultCnpjUseCase } from "./consult-cnpj.usecase";

export async function getCompanyByCnpj(
  cnpj: string,
  gateway: CnpjGateway,
  signal?: AbortSignal
): Promise<Company> {
  return consultCnpjUseCase({ cnpj, gateway, signal });
}
