/**
 * CNPJ Intelligence — Gateway Interface and Application Error Contracts
 */

import type { Company } from "../domain";

export type CnpjConsultErrorCode =
  | "INVALID_CNPJ"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "INTERNAL_ERROR";

export class CnpjConsultError extends Error {
  public readonly code: CnpjConsultErrorCode;
  public readonly originalError?: unknown;

  constructor(code: CnpjConsultErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = "CnpjConsultError";
    this.code = code;
    this.originalError = originalError;
    Object.setPrototypeOf(this, CnpjConsultError.prototype);
  }
}

/**
 * Contrato abstrato para provedores de dados cadastrais de CNPJ.
 * Permite trocar a fonte de dados (BrasilAPI, Receita, Mock, etc.) sem afetar o domínio ou use cases.
 */
export interface CnpjGateway {
  findByCnpj(cnpj: string, signal?: AbortSignal): Promise<Company>;
}
