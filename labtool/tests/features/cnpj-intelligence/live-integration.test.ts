import { describe, it, expect } from "vitest";
import { BrasilApiClient } from "@/features/cnpj-intelligence/infrastructure";
import { consultCnpjUseCase } from "@/features/cnpj-intelligence/application";

describe("CNPJ Intelligence — Live Integration: BrasilAPI", () => {
  const client = new BrasilApiClient();

  it(
    "deve consultar com sucesso um CNPJ real e retornar o modelo Company preenchido",
    async () => {
      // CNPJ real: Open Knowledge Brasil (19.131.243/0001-97)
      const company = await consultCnpjUseCase({
        cnpj: "19.131.243/0001-97",
        gateway: client,
      });

      expect(company.cnpj).toBe("19131243000197");
      expect(company.formattedCnpj).toBe("19.131.243/0001-97");
      expect(company.legalName).toContain("OPEN KNOWLEDGE");
      expect(company.registrationStatus).toBe("ATIVA");
      expect(company.primaryActivity).toBeDefined();
      expect(company.primaryActivity?.code).toBe("9430-8/00");
      expect(company.address).toBeDefined();
      expect(company.address?.state).toBe("SP");
      expect(company.partners).toBeDefined();
      expect(company.partners?.length).toBeGreaterThan(0);
    },
    15000
  );

  it(
    "deve retornar erro NOT_FOUND ao consultar um CNPJ inexistente mas com DV válido",
    async () => {
      // CNPJ com DV válido mas inexistente na base da RFB: 99.999.999/0001-91
      await expect(
        consultCnpjUseCase({
          cnpj: "99999999000191",
          gateway: client,
        })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    },
    15000
  );
});
