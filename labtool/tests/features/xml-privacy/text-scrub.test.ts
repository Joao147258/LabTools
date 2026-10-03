import { describe, it, expect } from "vitest";
import { scrubText } from "@/features/xml-privacy/application/text-scrub";
import type { FieldCategory } from "@/features/xml-privacy/domain/sanitization.types";

/**
 * Helper determinístico para testes de scrubText.
 */
function createMockReplacer() {
  const cache = new Map<string, string>();
  const counters = new Map<FieldCategory, number>();

  return (category: FieldCategory, originalValue: string): string => {
    const key = `${category}:${originalValue}`;
    const existing = cache.get(key);
    if (existing) {
      return existing;
    }

    const nextCount = (counters.get(category) || 0) + 1;
    counters.set(category, nextCount);

    const token = `[${category}_${String(nextCount).padStart(3, "0")}]`;
    cache.set(key, token);
    return token;
  };
}

describe("XML Privacy — Text Scrub", () => {
  it("deve retornar string vazia quando entrada for vazia ou nula", () => {
    const replace = createMockReplacer();
    expect(scrubText("", replace)).toBe("");
  });

  it("deve preservar texto sem PII inalterado", () => {
    const replace = createMockReplacer();
    const input = "Mercadoria entregue em perfeitas condições conforme pedido.";
    expect(scrubText(input, replace)).toBe(input);
  });

  it("não deve sanitizar números comuns e valores monetários que não sejam PII", () => {
    const replace = createMockReplacer();
    const input = "Item 102 com quantidade 5 e valor total R$ 1500,50 no lote 44558.";
    expect(scrubText(input, replace)).toBe(input);
  });

  it("deve sanitizar CPF formatado", () => {
    const replace = createMockReplacer();
    const input = "Cliente portador do CPF 123.456.789-00 presente no ato.";
    const result = scrubText(input, replace);
    expect(result).toBe("Cliente portador do CPF [CPF_001] presente no ato.");
  });

  it("deve sanitizar CPF apenas números (11 dígitos)", () => {
    const replace = createMockReplacer();
    const input = "Documento fiscal referente a 12345678901 emitido com sucesso.";
    const result = scrubText(input, replace);
    expect(result).toBe("Documento fiscal referente a [CPF_001] emitido com sucesso.");
  });

  it("deve sanitizar CNPJ formatado", () => {
    const replace = createMockReplacer();
    const input = "Transportadora ABC sob CNPJ 12.345.678/0001-95 responsável pelo frete.";
    const result = scrubText(input, replace);
    expect(result).toBe(
      "Transportadora ABC sob CNPJ [CNPJ_001] responsável pelo frete."
    );
  });

  it("deve sanitizar CNPJ apenas números (14 dígitos)", () => {
    const replace = createMockReplacer();
    const input = "Empresa filial 12345678000195 contratada.";
    const result = scrubText(input, replace);
    expect(result).toBe("Empresa filial [CNPJ_001] contratada.");
  });

  it("deve sanitizar endereços de e-mail", () => {
    const replace = createMockReplacer();
    const input = "Favor contatar suporte@empresa.com.br ou contato.fiscal@teste.org.";
    const result = scrubText(input, replace);
    expect(result).toBe("Favor contatar [CONTATO_001] ou [CONTATO_002].");
  });

  it("deve sanitizar telefones brasileiros em diferentes formatações", () => {
    const replace = createMockReplacer();
    const input =
      "Contatos: (11) 99999-8888, 11 98888-7777, +55 21 3333-4444 e fixo 3322-1100.";
    const result = scrubText(input, replace);
    expect(result).toContain("[CONTATO_");
    expect(result).not.toContain("99999-8888");
    expect(result).not.toContain("98888-7777");
    expect(result).not.toContain("3333-4444");
    expect(result).not.toContain("3322-1100");
  });

  it("deve produzir o mesmo token determinístico para o mesmo valor repetido", () => {
    const replace = createMockReplacer();
    const input =
      "Emitente CPF 111.222.333-44 confirmou o CPF 111.222.333-44 na assinatura.";
    const result = scrubText(input, replace);
    expect(result).toBe(
      "Emitente CPF [CPF_001] confirmou o CPF [CPF_001] na assinatura."
    );
  });

  it("deve gerar tokens sequenciais distintos para valores diferentes da mesma categoria", () => {
    const replace = createMockReplacer();
    const input =
      "Primeiro CPF 111.222.333-44 e segundo CPF 999.888.777-66 cadastrados.";
    const result = scrubText(input, replace);
    expect(result).toBe(
      "Primeiro CPF [CPF_001] e segundo CPF [CPF_002] cadastrados."
    );
  });

  it("deve sanitizar múltiplos tipos de PII no mesmo texto composto", () => {
    const replace = createMockReplacer();
    const input =
      "Nota emitida por 12.345.678/0001-95 para o cliente João (CPF 123.456.789-00, e-mail joao@email.com, fone (11) 91234-5678).";
    const result = scrubText(input, replace);

    expect(result).toBe(
      "Nota emitida por [CNPJ_001] para o cliente João (CPF [CPF_001], e-mail [CONTATO_001], fone [CONTATO_002])."
    );
  });
});
