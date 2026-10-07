import { describe, it, expect } from "vitest";
import { inspectXml } from "@/features/xml-sanitizer/application/xml-inspector";
import { sanitizeXml } from "@/features/xml-sanitizer/application/xml-sanitizer";
import { parseSafeDocument } from "@/features/xml-sanitizer/application/xml-parser";

describe("XML Privacy — Privacy Invariants & Regression Suite", () => {
  describe("1. Teste de Regressão Obrigatório: Razão Social e PII Municipal/CBS-IBS", () => {
    const REGRESSION_FIXTURE = `<notafiscal>
  <cnpj_cpf_prestador>11111111000191</cnpj_cpf_prestador>

  <cnpj_cpf_destinatario>22222222000191</cnpj_cpf_destinatario>

  <razao_social_destinatario>
    EMPRESA TESTE LTDA
  </razao_social_destinatario>

  <fone_destinatario>
    11999999999
  </fone_destinatario>

  <email_destinatario>
    contato@empresa-teste.invalid
  </email_destinatario>

  <cnpj_cpf_destinatario_cbsibs>
    22222222000191
  </cnpj_cpf_destinatario_cbsibs>

  <razao_social_destinatario_cbsibs>
    EMPRESA TESTE LTDA
  </razao_social_destinatario_cbsibs>
</notafiscal>`;

    it("deve classificar corretamente os campos sensíveis e selecioná-los por padrão", () => {
      const fields = inspectXml(REGRESSION_FIXTURE);

      const razaoDest = fields.find((f) => f.tag === "razao_social_destinatario");
      expect(razaoDest).toBeDefined();
      expect(razaoDest?.category).toBe("RAZAO_SOCIAL");
      expect(razaoDest?.action).toBe("REPLACE");
      expect(razaoDest?.selected).toBe(true);

      const razaoCbsibs = fields.find((f) => f.tag === "razao_social_destinatario_cbsibs");
      expect(razaoCbsibs).toBeDefined();
      expect(razaoCbsibs?.category).toBe("RAZAO_SOCIAL");
      expect(razaoCbsibs?.action).toBe("REPLACE");
      expect(razaoCbsibs?.selected).toBe(true);

      const foneDest = fields.find((f) => f.tag === "fone_destinatario");
      expect(foneDest?.category).toBe("CONTATO");
      expect(foneDest?.selected).toBe(true);

      const emailDest = fields.find((f) => f.tag === "email_destinatario");
      expect(emailDest?.category).toBe("CONTATO");
      expect(emailDest?.selected).toBe(true);
    });

    it("deve sanitizar completamente todos os dados sensíveis sem vazamento em texto claro", () => {
      const fields = inspectXml(REGRESSION_FIXTURE);
      const result = sanitizeXml(REGRESSION_FIXTURE, fields);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Invariantes de Não-Vazamento (Zero Leaks)
      expect(result.sanitizedXml).not.toContain("EMPRESA TESTE LTDA");
      expect(result.sanitizedXml).not.toContain("11999999999");
      expect(result.sanitizedXml).not.toContain("contato@empresa-teste.invalid");
      expect(result.sanitizedXml).not.toContain("11111111000191");
      expect(result.sanitizedXml).not.toContain("22222222000191");

      // Invariante de Preservação de Identidade: O mesmo valor original gera o MESMO token sintético
      expect(result.sanitizedXml).toContain(
        "<razao_social_destinatario>[RAZAO_SOCIAL_001]</razao_social_destinatario>"
      );
      expect(result.sanitizedXml).toContain(
        "<razao_social_destinatario_cbsibs>[RAZAO_SOCIAL_001]</razao_social_destinatario_cbsibs>"
      );
      expect(result.sanitizedXml).not.toContain("[RAZAO_SOCIAL_002]");

      // Validar XML resultante válido
      const parsed = parseSafeDocument(result.sanitizedXml);
      expect(parsed.documentElement).not.toBeNull();
    });
  });

  describe("2. Preservação de Identidade para Entidades Diferentes", () => {
    it("deve gerar tokens sequenciais distintos para empresas diferentes", () => {
      const xml = `<notafiscal>
        <razao_social_prestador>EMPRESA ALFA LTDA</razao_social_prestador>
        <razao_social_destinatario>EMPRESA BETA LTDA</razao_social_destinatario>
      </notafiscal>`;

      const fields = inspectXml(xml);
      const result = sanitizeXml(xml, fields);

      expect(result.success).toBe(true);
      expect(result.sanitizedXml).not.toContain("EMPRESA ALFA LTDA");
      expect(result.sanitizedXml).not.toContain("EMPRESA BETA LTDA");

      expect(result.sanitizedXml).toContain(
        "<razao_social_prestador>[RAZAO_SOCIAL_001]</razao_social_prestador>"
      );
      expect(result.sanitizedXml).toContain(
        "<razao_social_destinatario>[RAZAO_SOCIAL_002]</razao_social_destinatario>"
      );
    });
  });

  describe("3. Privacy Invariant: Garantia de Não-Vazamento Geral", () => {
    it("nenhum valor selecionado para REPLACE pode permanecer em texto claro no XML sanitizado", () => {
      const xml = `<documentoFiscal>
        <prestador>
          <cnpj_cpf_prestador>12345678000195</cnpj_cpf_prestador>
          <razao_social_prestador>PRESTADOR DE SERVICOS SA</razao_social_prestador>
          <nome_responsavel>JOSE DA SILVA</nome_responsavel>
          <im_prestador>1234567</im_prestador>
          <email_contato>suporte@prestador.com.br</email_contato>
        </prestador>
        <tomador>
          <cnpj_cpf_destinatario>98765432000188</cnpj_cpf_destinatario>
          <razao_social_destinatario>TOMADOR CLIENTE EIRELI</razao_social_destinatario>
          <pessoa_destinatario>J</pessoa_destinatario>
          <endereco_destinatario>AV PAULISTA 1000</endereco_destinatario>
          <cep_destinatario>01310100</cep_destinatario>
        </tomador>
      </documentoFiscal>`;

      const fields = inspectXml(xml);
      const result = sanitizeXml(xml, fields);

      expect(result.success).toBe(true);

      // PRIVACY INVARIANT CHECK
      for (const field of fields) {
        if (field.selected && field.action === "REPLACE" && field.value.trim().length > 0) {
          expect(result.sanitizedXml).not.toContain(field.value.trim());
        }
      }

      // Preservação de Campos não-sensíveis / não-selecionados por padrão
      expect(result.sanitizedXml).toContain("<pessoa_destinatario>J</pessoa_destinatario>");
      expect(result.sanitizedXml).toContain("<im_prestador>1234567</im_prestador>");
      expect(result.sanitizedXml).toContain("<endereco_destinatario>AV PAULISTA 1000</endereco_destinatario>");
      expect(result.sanitizedXml).toContain("<cep_destinatario>01310100</cep_destinatario>");
    });
  });
});
