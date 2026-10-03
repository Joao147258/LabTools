import { describe, it, expect } from "vitest";
import type { ComparisonExportInput } from "@/features/xml-comparator/domain";
import { exportComparisonToMarkdown } from "@/features/xml-comparator/application/markdown-exporter";

describe("XML Comparator — Markdown Exporter (markdown-exporter)", () => {
  it("deve exportar relatório com sucesso contendo XML aprovado e rejeitado sanitizados", () => {
    const input: ComparisonExportInput = {
      approved: {
        name: "nfse-aprovada.xml",
        size: 1500,
        text: `<NFSe><emit><CNPJ>11111111000111</CNPJ><xNome>Empresa A</xNome></emit></NFSe>`,
      },
      rejected: {
        name: "nfse-rejeitada.xml",
        size: 1520,
        text: `<NFSe><emit><CNPJ>11111111000111</CNPJ><xNome>Empresa A</xNome></emit><xObs>Erro no CPF 12345678901</xObs></NFSe>`,
      },
    };

    const result = exportComparisonToMarkdown(input);

    expect(result.success).toBe(true);
    expect(result.filename).toMatch(/^comparacao-xml-\d{4}-\d{2}-\d{2}\.md$/);
    expect(result.markdown).toBeDefined();

    // Verificações de sanitização no Markdown
    expect(result.markdown).not.toContain("11111111000111");
    expect(result.markdown).not.toContain("12345678901");
    expect(result.markdown).toContain("[CNPJ_001]");
    expect(result.markdown).toContain("[CPF_001]");
    expect(result.markdown).toContain("nfse-aprovada.xml");
    expect(result.markdown).toContain("nfse-rejeitada.xml");
  });

  it("deve compartilhar o mesmo contexto relacional entre Aprovado, Rejeitado e Erro", () => {
    const sharedCnpj = "11.111.111/0001-11";
    const input: ComparisonExportInput = {
      approved: {
        name: "aprovado.xml",
        size: 100,
        text: `<NFSe><emit><CNPJ>${sharedCnpj}</CNPJ></emit></NFSe>`,
      },
      rejected: {
        name: "rejeitado.xml",
        size: 100,
        text: `<NFSe><emit><CNPJ>${sharedCnpj}</CNPJ></emit></NFSe>`,
      },
      errorFile: {
        name: "retorno.json",
        size: 80,
        text: JSON.stringify({ mensagem: `Falha com CNPJ ${sharedCnpj}` }),
      },
    };

    const result = exportComparisonToMarkdown(input);

    expect(result.success).toBe(true);
    expect(result.markdown).not.toContain(sharedCnpj);

    // O mesmo CNPJ deve ter sido convertido exatamente para [CNPJ_001] em todas as ocorrências
    const occurrences = (result.markdown?.match(/\[CNPJ_001\]/g) || []).length;
    expect(occurrences).toBe(3);
    expect(result.markdown).not.toContain("[CNPJ_002]");
  });

  it("deve incluir seção de erro formatada de acordo com o tipo (XML, JSON ou Texto)", () => {
    const inputJson: ComparisonExportInput = {
      approved: { name: "app.xml", size: 100, text: `<NFSe><id>1</id></NFSe>` },
      rejected: { name: "rej.xml", size: 100, text: `<NFSe><id>2</id></NFSe>` },
      errorFile: {
        name: "erro.json",
        size: 50,
        text: `{"codigo": 404, "descricao": "Serviço não encontrado"}`,
      },
    };

    const result = exportComparisonToMarkdown(inputJson);
    expect(result.success).toBe(true);
    expect(result.markdown).toContain("```json");
    expect(result.markdown).toContain("Serviço não encontrado");
  });

  it("deve escapar delimitadores de código Markdown ``` para evitar quebras", () => {
    const input: ComparisonExportInput = {
      approved: { name: "app.xml", size: 100, text: `<NFSe><id>1</id></NFSe>` },
      rejected: { name: "rej.xml", size: 100, text: `<NFSe><id>2</id></NFSe>` },
      errorFile: {
        name: "erro.txt",
        size: 60,
        text: "Mensagem contendo ``` delimitadores ``` de código",
      },
    };

    const result = exportComparisonToMarkdown(input);
    expect(result.success).toBe(true);
    // Não deve conter blocos ``` triplos soltos desbalanceados no texto do erro
    expect(result.markdown).toContain("`` ` delimitadores `` `");
  });

  it("deve falhar com mensagem descritiva se documentos obrigatórios estiverem ausentes", () => {
    const inputWithoutApproved = {
      approved: { name: "", size: 0, text: "" },
      rejected: { name: "rej.xml", size: 100, text: "<NFSe/>" },
    };

    const result = exportComparisonToMarkdown(inputWithoutApproved as ComparisonExportInput);
    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain("XML aprovado é obrigatório");
  });

  it("deve falhar de forma segura (fail-stop) se a sanitização de qualquer documento falhar", () => {
    const inputWithCorruptXml: ComparisonExportInput = {
      approved: { name: "app.xml", size: 100, text: `<NFSe><CNPJ>123</NFSe>` }, // XML malformado
      rejected: { name: "rej.xml", size: 100, text: `<NFSe><id>2</id></NFSe>` },
    };

    const result = exportComparisonToMarkdown(inputWithCorruptXml);
    expect(result.success).toBe(false);
    expect(result.markdown).toBeUndefined();
    expect(result.errorMessage).toBeDefined();
  });
});
