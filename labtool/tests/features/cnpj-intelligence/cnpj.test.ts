import { describe, it, expect } from "vitest";
import {
  normalizeCnpj,
  formatCnpj,
  validateCnpj,
  formatZipCode,
  formatCnae,
  formatCurrencyBrl,
  formatDateIsoToBr,
  normalizeRegistrationStatus,
  buildConsolidatedAddress,
  buildTaxRegime,
  sanitizeCompanyEntity,
} from "@/features/cnpj-intelligence/domain";

describe("CNPJ Intelligence — Domain: CNPJ Operations", () => {
  // CNPJs válidos conhecidos
  const VALID_CNPJ_1 = "19131243000197"; // Open Knowledge Brasil
  const VALID_CNPJ_1_FORMATTED = "19.131.243/0001-97";
  const VALID_CNPJ_2 = "33000167000101"; // Petrobras
  const VALID_CNPJ_2_FORMATTED = "33.000.167/0001-01";
  const VALID_CNPJ_3 = "00000000000191"; // Banco do Brasil
  const VALID_CNPJ_3_FORMATTED = "00.000.000/0001-91";

  describe("normalizeCnpj", () => {
    it("deve remover pontos, barras, traços e espaços", () => {
      expect(normalizeCnpj("19.131.243/0001-97")).toBe("19131243000197");
      expect(normalizeCnpj("  33.000.167/0001-01  ")).toBe("33000167000101");
      expect(normalizeCnpj("00-000-000/0001.91")).toBe("00000000000191");
    });

    it("deve retornar string vazia para valores nulos, vazios ou undefined", () => {
      expect(normalizeCnpj("")).toBe("");
      expect(normalizeCnpj(null)).toBe("");
      expect(normalizeCnpj(undefined)).toBe("");
    });

    it("deve remover caracteres alfabéticos ou especiais", () => {
      expect(normalizeCnpj("CNPJ: 19131243000197_ABC")).toBe("19131243000197");
    });
  });

  describe("formatCnpj", () => {
    it("deve formatar CNPJ de 14 dígitos no padrão 00.000.000/0000-00", () => {
      expect(formatCnpj("19131243000197")).toBe(VALID_CNPJ_1_FORMATTED);
      expect(formatCnpj("33000167000101")).toBe(VALID_CNPJ_2_FORMATTED);
      expect(formatCnpj("00000000000191")).toBe(VALID_CNPJ_3_FORMATTED);
    });

    it("deve formatar progressivamente entradas parciais durante digitação", () => {
      expect(formatCnpj("19")).toBe("19");
      expect(formatCnpj("191")).toBe("19.1");
      expect(formatCnpj("19131")).toBe("19.131");
      expect(formatCnpj("191312")).toBe("19.131.2");
      expect(formatCnpj("19131243")).toBe("19.131.243");
      expect(formatCnpj("191312430001")).toBe("19.131.243/0001");
      expect(formatCnpj("1913124300019")).toBe("19.131.243/0001-9");
      expect(formatCnpj("19131243000197")).toBe("19.131.243/0001-97");
    });

    it("deve limitar a formatação ao tamanho máximo de 14 dígitos", () => {
      expect(formatCnpj("1913124300019799999")).toBe("19.131.243/0001-97");
    });

    it("deve retornar vazio para entrada nula ou indefinida", () => {
      expect(formatCnpj("")).toBe("");
      expect(formatCnpj(null)).toBe("");
      expect(formatCnpj(undefined)).toBe("");
    });
  });

  describe("validateCnpj", () => {
    it("deve validar com sucesso CNPJs válidos com e sem máscara", () => {
      expect(validateCnpj(VALID_CNPJ_1)).toBe(true);
      expect(validateCnpj(VALID_CNPJ_1_FORMATTED)).toBe(true);
      expect(validateCnpj(VALID_CNPJ_2)).toBe(true);
      expect(validateCnpj(VALID_CNPJ_2_FORMATTED)).toBe(true);
      expect(validateCnpj(VALID_CNPJ_3)).toBe(true);
      expect(validateCnpj(VALID_CNPJ_3_FORMATTED)).toBe(true);
    });

    it("deve rejeitar CNPJs com primeiro dígito verificador incorreto", () => {
      // 19.131.243/0001-87 (DV1 deveria ser 9, informado 8)
      expect(validateCnpj("19131243000187")).toBe(false);
    });

    it("deve rejeitar CNPJs com segundo dígito verificador incorreto", () => {
      // 19.131.243/0001-96 (DV2 deveria ser 7, informado 6)
      expect(validateCnpj("19131243000196")).toBe(false);
    });

    it("deve rejeitar sequências com todos os dígitos iguais", () => {
      const repeated = [
        "00000000000000",
        "11111111111111",
        "22222222222222",
        "33333333333333",
        "44444444444444",
        "55555555555555",
        "66666666666666",
        "77777777777777",
        "88888888888888",
        "99999999999999",
      ];

      for (const cnpj of repeated) {
        expect(validateCnpj(cnpj)).toBe(false);
      }
    });

    it("deve rejeitar entradas com quantidade incorreta de dígitos", () => {
      expect(validateCnpj("123")).toBe(false);
      expect(validateCnpj("1913124300019")).toBe(false); // 13 dígitos
      expect(validateCnpj("191312430001970")).toBe(false); // 15 dígitos
      expect(validateCnpj("")).toBe(false);
      expect(validateCnpj(null)).toBe(false);
      expect(validateCnpj(undefined)).toBe(false);
    });

    it("deve rejeitar strings que não contêm dígitos numéricos", () => {
      expect(validateCnpj("abcdefghijklmn")).toBe(false);
      expect(validateCnpj("!@#$%^&*()_+{}")).toBe(false);
    });
  });

  describe("buildTaxRegime", () => {
    it("deve classificar corretamente optante pelo Simples Nacional", () => {
      const regime = buildTaxRegime({
        isSimples: true,
        simplesOptDate: "2018-01-01",
      });

      expect(regime.name).toBe("Simples Nacional");
      expect(regime.isSimplesNacional).toBe(true);
      expect(regime.simplesOptDate).toBe("01/01/2018");
      expect(regime.details).toBe("Optante pelo Simples desde 01/01/2018");
    });

    it("deve classificar corretamente optante pelo MEI", () => {
      const regime = buildTaxRegime({
        isSimples: true,
        isMei: true,
        meiOptDate: "2020-05-10",
      });

      expect(regime.name).toBe("Microempreendedor Individual (MEI)");
      expect(regime.isMei).toBe(true);
      expect(regime.meiOptDate).toBe("10/05/2020");
      expect(regime.details).toBe("Optante pelo MEI desde 10/05/2020");
    });

    it("deve identificar exclusão do Simples Nacional", () => {
      const regime = buildTaxRegime({
        isSimples: false,
        simplesOptDate: "2015-01-01",
        simplesExcludedDate: "2021-12-31",
      });

      expect(regime.name).toBe("Não Optante pelo Simples Nacional");
      expect(regime.isSimplesNacional).toBe(false);
      expect(regime.simplesExcludedDate).toBe("31/12/2021");
      expect(regime.details).toBe("Excluído do Simples em 31/12/2021");
    });

    it("deve priorizar customName quando fornecido para Lucro Real ou Presumido", () => {
      const regime = buildTaxRegime({
        isSimples: false,
        isMei: false,
        customName: "LUCRO REAL (2024)",
      });

      expect(regime.name).toBe("LUCRO REAL (2024)");
      expect(regime.isSimplesNacional).toBe(false);
      expect(regime.isMei).toBe(false);
    });

    it("deve definir Regime Normal quando nenhuma opção for especificada", () => {
      const regime = buildTaxRegime({});
      expect(regime.name).toBe("Regime Normal (Lucro Presumido / Real / Outros)");
    });
  });

  describe("Domain Utility Helpers", () => {
    it("formatZipCode deve formatar CEP de 8 dígitos", () => {
      expect(formatZipCode("01310100")).toBe("01310-100");
      expect(formatZipCode(1310100)).toBe("01310-100");
      expect(formatZipCode("")).toBe("");
      expect(formatZipCode(null)).toBe("");
    });

    it("formatCnae deve formatar código CNAE de 7 dígitos", () => {
      expect(formatCnae("6201501")).toBe("6201-5/01");
      expect(formatCnae(6201501)).toBe("6201-5/01");
      expect(formatCnae("")).toBe("");
    });

    it("formatCurrencyBrl deve formatar valores monetários em R$", () => {
      expect(formatCurrencyBrl(1000)).toContain("1.000,00");
      expect(formatCurrencyBrl(0)).toContain("0,00");
      expect(formatCurrencyBrl(null)).toContain("0,00");
    });

    it("formatDateIsoToBr deve converter YYYY-MM-DD para DD/MM/YYYY", () => {
      expect(formatDateIsoToBr("2021-04-14")).toBe("14/04/2021");
      expect(formatDateIsoToBr("2021-04-14T00:00:00.000Z")).toBe("14/04/2021");
      expect(formatDateIsoToBr("14/04/2021")).toBe("14/04/2021");
      expect(formatDateIsoToBr("")).toBe("");
    });

    it("normalizeRegistrationStatus deve mapear códigos e descrições", () => {
      expect(normalizeRegistrationStatus(2)).toBe("ATIVA");
      expect(normalizeRegistrationStatus("ATIVA")).toBe("ATIVA");
      expect(normalizeRegistrationStatus(8)).toBe("BAIXADA");
      expect(normalizeRegistrationStatus("BAIXADA")).toBe("BAIXADA");
      expect(normalizeRegistrationStatus(4)).toBe("INAPTA");
      expect(normalizeRegistrationStatus(3)).toBe("SUSPENSA");
      expect(normalizeRegistrationStatus(1)).toBe("NULA");
      expect(normalizeRegistrationStatus("OUTRO")).toBe("DESCONHECIDA");
    });

    it("buildConsolidatedAddress deve consolidar partes do endereço", () => {
      const addr = {
        street: "Av. Paulista",
        number: "1000",
        complement: "Conjunto 101",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        zipCode: "01310-100",
      };
      expect(buildConsolidatedAddress(addr)).toBe(
        "Av. Paulista, 1000 - Conjunto 101, Bela Vista, São Paulo - SP, CEP 01310-100"
      );
    });

    it("sanitizeCompanyEntity deve higienizar e enriquecer a entidade", () => {
      const company = sanitizeCompanyEntity({
        cnpj: "19131243000197",
        legalName: "  Open Knowledge Brasil  ",
        registrationStatus: "ATIVA",
        shareCapital: 100000,
      });

      expect(company.cnpj).toBe("19131243000197");
      expect(company.formattedCnpj).toBe("19.131.243/0001-97");
      expect(company.legalName).toBe("Open Knowledge Brasil");
      expect(company.formattedShareCapital).toContain("100.000,00");
    });
  });
});
