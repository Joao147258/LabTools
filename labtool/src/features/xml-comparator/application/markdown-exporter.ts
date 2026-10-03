/**
 * XML Comparator — Markdown Exporter
 *
 * Responsabilidade:
 * Orquestra a sanitização e a geração do relatório técnico em formato Markdown
 * a partir dos documentos analisados (XML Aprovado, XML Rejeitado e Retorno de Erro opcional).
 *
 * O que faz:
 * - Valida a presença dos documentos obrigatórios (Aprovado e Rejeitado);
 * - Instancia e gerencia o ciclo de vida do `SanitizationContext` relacional compartilhado;
 * - Sanitiza defensivamente todos os documentos antes de montar o relatório;
 * - Trata caracteres especiais e evita quebras acidentais de blocos de código Markdown;
 * - Garante limpeza total do contexto no bloco `finally`;
 * - Retorna o contrato `ComparisonExportResult` de sucesso ou falha (fail-stop).
 *
 * O que NÃO faz:
 * - Não executa a comparação estrutural (papel do xml-differ);
 * - Não realiza operações de I/O, download via browser (Blob/URL) ou UI React.
 */

import type {
  ComparisonExportInput,
  ComparisonExportResult,
} from "../domain";
import {
  clearSanitizationContext,
  createSanitizationContext,
  sanitizeErrorDocument,
  sanitizeXmlDocument,
} from "./export-sanitizer";

/**
 * Escapa sequências de três acentos graves (```) no conteúdo interno para evitar
 * fechamento prematuro de blocos de código Markdown.
 */
function escapeCodeBlockContent(content: string): string {
  if (!content) return "";
  return content.replace(/```/g, "`` `");
}

/**
 * Orquestra a exportação do relatório de comparação para Markdown sanitizado.
 */
export function exportComparisonToMarkdown(
  input: ComparisonExportInput
): ComparisonExportResult {
  if (!input) {
    return {
      success: false,
      filename: "",
      errorMessage: "Parâmetros de exportação ausentes.",
    };
  }

  if (!input.approved?.text || !input.approved.text.trim()) {
    return {
      success: false,
      filename: "",
      errorMessage: "O documento XML aprovado é obrigatório para a exportação.",
    };
  }

  if (!input.rejected?.text || !input.rejected.text.trim()) {
    return {
      success: false,
      filename: "",
      errorMessage: "O documento XML rejeitado é obrigatório para a exportação.",
    };
  }

  const context = createSanitizationContext();
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `comparacao-xml-${dateStr}.md`;

  try {
    // 1. Sanitizar XML Aprovado
    const sanitizedApproved = sanitizeXmlDocument(
      input.approved.text,
      context
    );

    // 2. Sanitizar XML Rejeitado com o mesmo contexto compartilhado
    const sanitizedRejected = sanitizeXmlDocument(
      input.rejected.text,
      context
    );

    // 3. Sanitizar Retorno de Erro opcional
    let errorSection = "";
    if (input.errorFile?.text && input.errorFile.text.trim()) {
      const sanitizedError = sanitizeErrorDocument(
        input.errorFile.text,
        context
      );

      const errorBlockLang =
        sanitizedError.format === "xml"
          ? "xml"
          : sanitizedError.format === "json"
          ? "json"
          : "text";

      errorSection = `
## Documento Complementar / Retorno de Erro (${input.errorFile.name})

\`\`\`${errorBlockLang}
${escapeCodeBlockContent(sanitizedError.content)}
\`\`\`
`;
    }

    // 4. Montar Markdown consolidado
    const markdown = `# Relatório de Comparação XML — LabTool

> **Data de Geração**: ${dateStr}  
> **Processamento**: 100% Local / Client-Side (Dados anonimizados e pseudonimizados).

---

## Documentos Analisados
- **XML Aprovado**: \`${input.approved.name}\` (${input.approved.size.toLocaleString("pt-BR")} bytes)
- **XML Rejeitado**: \`${input.rejected.name}\` (${input.rejected.size.toLocaleString("pt-BR")} bytes)${
      input.errorFile
        ? `\n- **Retorno de Erro**: \`${input.errorFile.name}\` (${input.errorFile.size.toLocaleString("pt-BR")} bytes)`
        : ""
      }

---

## XML Aprovado (Sanitizado)

\`\`\`xml
${escapeCodeBlockContent(sanitizedApproved)}
\`\`\`

---

## XML Rejeitado (Sanitizado)

\`\`\`xml
${escapeCodeBlockContent(sanitizedRejected)}
\`\`\`
${errorSection}
---
*Relatório gerado pelo LabTool XML Comparator.*
`;

    return {
      success: true,
      markdown,
      filename,
    };
  } catch (error) {
    return {
      success: false,
      filename: "",
      errorMessage:
        error instanceof Error
          ? error.message
          : "Falha na higienização e geração do relatório Markdown.",
    };
  } finally {
    // Garantir limpeza total das tabelas de mapeamento em memória
    clearSanitizationContext(context);
  }
}
