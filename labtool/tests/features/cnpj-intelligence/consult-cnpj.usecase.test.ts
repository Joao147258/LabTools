import { describe, it, expect, vi } from "vitest";
import {
  consultCnpjUseCase,
  CnpjConsultError,
  type CnpjGateway,
} from "@/features/cnpj-intelligence/application";
import type { Company } from "@/features/cnpj-intelligence/domain";

describe("CNPJ Intelligence — Application: Consult CNPJ Use Case", () => {
  const mockCompany: Company = {
    cnpj: "19131243000197",
    formattedCnpj: "19.131.243/0001-97",
    legalName: "OPEN KNOWLEDGE BRASIL",
    registrationStatus: "ATIVA",
    openingDate: "03/10/2013",
    secondaryActivities: [],
    partners: [],
  };

  it("deve bloquear CNPJ vazio sem chamar o gateway", async () => {
    const gateway: CnpjGateway = {
      findByCnpj: vi.fn(),
    };

    await expect(
      consultCnpjUseCase({ cnpj: "", gateway })
    ).rejects.toThrow(CnpjConsultError);

    expect(gateway.findByCnpj).not.toHaveBeenCalled();
  });

  it("deve bloquear CNPJ inválido sem chamar o gateway", async () => {
    const gateway: CnpjGateway = {
      findByCnpj: vi.fn(),
    };

    await expect(
      consultCnpjUseCase({ cnpj: "11111111111111", gateway })
    ).rejects.toThrow(CnpjConsultError);

    expect(gateway.findByCnpj).not.toHaveBeenCalled();
  });

  it("deve normalizar o CNPJ e consultar o gateway quando o CNPJ for válido", async () => {
    const gateway: CnpjGateway = {
      findByCnpj: vi.fn().mockResolvedValue(mockCompany),
    };

    const result = await consultCnpjUseCase({
      cnpj: "19.131.243/0001-97",
      gateway,
    });

    expect(gateway.findByCnpj).toHaveBeenCalledWith("19131243000197", undefined);
    expect(result.legalName).toBe("OPEN KNOWLEDGE BRASIL");
    expect(result.registrationStatus).toBe("ATIVA");
  });

  it("deve propagar erro de empresa não encontrada lançado pelo gateway", async () => {
    const gateway: CnpjGateway = {
      findByCnpj: vi
        .fn()
        .mockRejectedValue(new CnpjConsultError("NOT_FOUND", "Nenhuma empresa foi encontrada.")),
    };

    await expect(
      consultCnpjUseCase({ cnpj: "19131243000197", gateway })
    ).rejects.toThrow("Nenhuma empresa foi encontrada.");
  });

  it("deve propagar erro de timeout lançado pelo gateway", async () => {
    const gateway: CnpjGateway = {
      findByCnpj: vi
        .fn()
        .mockRejectedValue(new CnpjConsultError("TIMEOUT", "Tempo limite excedido.")),
    };

    await expect(
      consultCnpjUseCase({ cnpj: "19131243000197", gateway })
    ).rejects.toThrow("Tempo limite excedido.");
  });
});
