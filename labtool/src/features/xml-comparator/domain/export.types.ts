/**
 * XML Comparator — Export Domain Types
 *
 * Responsabilidade:
 * Define os contratos e estruturas neutras para exportação sanitizada
 * e geração de relatórios Markdown do XML Comparator.
 *
 * Contratos:
 * - ComparisonFieldCategory: Categorias semânticas de dados para sanitização na exportação
 * - SanitizationContext: Contexto em memória com mapeamentos e contadores para consistência
 * - ErrorDocumentFormat: Formatos aceitos para documento de erro
 * - SanitizedExportDocument: Documento sanitizado intermediário
 * - ComparisonExportInput: Entradas para o fluxo de exportação
 * - ComparisonExportResult: Resultado da exportação do relatório Markdown
 *
 * Princípios:
 * - Isolado e independente do XML Privacy Engine;
 * - Sanitização ocorre apenas no momento da exportação (após a comparação local);
 * - Mapeamentos existem somente em memória durante o ciclo de exportação;
 * - Depende unicamente de comparison.types dentro do domínio.
 */

import type { LoadedFile } from "./comparison.types";

/**
 * Categorias semânticas utilizadas pelo catálogo de sanitização do Comparator.
 */
export type ComparisonFieldCategory =
  | "CPF"
  | "CNPJ"
  | "NOME"
  | "RAZAO_SOCIAL"
  | "CONTATO"
  | "IDENTIFICADOR_DPS"
  | "DOCUMENTO"
  | "INSCRICAO"
  | "ENDERECO"
  | "TEXTO_LIVRE"
  | "ASSINATURA"
  | "OUTRO";

/**
 * Contexto de sanitização temporário mantido em memória durante a exportação.
 * Garante consistência de pseudonimização entre todos os documentos comparados.
 */
export interface SanitizationContext {
  /** Mapeamento de "CATEGORIA:VALOR_NORMALIZADO" -> placeholder gerado (ex.: "CNPJ:11111111000111" -> "[CNPJ_001]"). */
  mappings: Map<string, string>;

  /** Contadores sequenciais por categoria (ex.: CNPJ -> 2, CPF -> 3). */
  counters: Map<string, number>;
}

/**
 * Formatos suportados para o documento complementar de retorno/erro.
 */
export type ErrorDocumentFormat =
  | "xml"
  | "json"
  | "text";

/**
 * Representação de um documento com conteúdo já sanitizado pronto para inclusão no relatório.
 */
export interface SanitizedExportDocument {
  /** Formato detectado do documento. */
  format: "xml" | "json" | "text";

  /** Conteúdo textual do documento higienizado. */
  content: string;
}

/**
 * Parâmetros de entrada para o processo de exportação do relatório.
 */
export interface ComparisonExportInput {
  /** Documento XML aprovado original. */
  approved: LoadedFile;

  /** Documento XML rejeitado original. */
  rejected: LoadedFile;

  /** Documento de retorno de erro opcional. */
  errorFile?: LoadedFile | null;
}

/**
 * Resultado produzido pelo exportador de relatório Markdown.
 */
export interface ComparisonExportResult {
  /** Indica se a geração do relatório foi concluída com sucesso. */
  success: boolean;

  /** Conteúdo Markdown gerado e sanitizado (quando success === true). */
  markdown?: string;

  /** Nome do arquivo sugerido para download (ex.: "xml-comparison.md"). */
  filename: string;

  /** Mensagem de erro descritiva em caso de falha. */
  errorMessage?: string;
}
