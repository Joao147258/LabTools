/**
 * CNPJ Intelligence — External Provider Client (BrasilAPI)
 *
 * Implementação do gateway de infraestrutura utilizando a BrasilAPI pública v1.
 * Contém controle defensivo de timeout, isolamento de cabeçalhos e tradução estrita de erros HTTP.
 */

import type { CnpjGateway } from "../application/cnpj-gateway.interface";
import { CnpjConsultError } from "../application/cnpj-gateway.interface";
import type { Company } from "../domain";
import { CompanyApiMapper } from "./brasil-api.mapper";
import type { BrasilApiCnpjResponse } from "./brasil-api.types";

export class BrasilApiClient implements CnpjGateway {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options?: { baseUrl?: string; timeoutMs?: number }) {
    this.baseUrl = options?.baseUrl || "https://brasilapi.com.br/api/cnpj/v1";
    this.timeoutMs = options?.timeoutMs || 10000;
  }

  public async findByCnpj(cnpj: string, externalSignal?: AbortSignal): Promise<Company> {
    const cleanCnpj = cnpj.replace(/\D/g, "");
    const url = `${this.baseUrl}/${cleanCnpj}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    // Conecta o signal externo se fornecido
    if (externalSignal) {
      externalSignal.addEventListener("abort", () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 LabTool/1.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const rawData = (await response.json()) as BrasilApiCnpjResponse;
        if (rawData && "registrationStatus" in rawData && "legalName" in rawData) {
          return rawData as unknown as Company;
        }
        return CompanyApiMapper.toDomain(rawData);
      }

      if (response.status === 404) {
        throw new CnpjConsultError(
          "NOT_FOUND",
          "Nenhuma empresa foi encontrada para este CNPJ na base oficial."
        );
      }

      if (response.status === 400) {
        throw new CnpjConsultError(
          "INVALID_CNPJ",
          "CNPJ inválido ou rejeitado pelo provedor cadastral."
        );
      }

      if (response.status === 429) {
        throw new CnpjConsultError(
          "RATE_LIMITED",
          "Limite de requisições excedido. Por favor, aguarde alguns segundos antes de tentar novamente."
        );
      }

      if (response.status >= 500) {
        throw new CnpjConsultError(
          "SERVICE_UNAVAILABLE",
          "O serviço de consulta da Receita Federal está temporariamente indisponível. Tente novamente mais tarde."
        );
      }

      throw new CnpjConsultError(
        "INTERNAL_ERROR",
        `Erro inesperado na resposta do servidor (HTTP ${response.status}).`
      );
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof CnpjConsultError) {
        throw err;
      }

      if (err instanceof Error && err.name === "AbortError") {
        throw new CnpjConsultError(
          "TIMEOUT",
          "A consulta demorou mais que o tempo limite de resposta (10s)."
        );
      }

      throw new CnpjConsultError(
        "NETWORK_ERROR",
        "Falha de conexão com o serviço de dados cadastrais.",
        err
      );
    }
  }
}
