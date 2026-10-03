/**
 * XML Comparator — Comparison Domain Types
 *
 * Responsabilidade:
 * Define os contratos centrais e estruturas neutras para representação
 * das diferenças estruturais, resumos e resultados de comparação entre dois documentos XML.
 *
 * Contratos:
 * - DiffKind: Tipos semânticos de divergência entre documentos
 * - AttributeDiffDetail: Divergência entre atributos de um elemento
 * - XmlComparisonDiff: Representação completa de uma divergência detectada
 * - XmlComparisonSummary: Métricas e resumo quantitativo consolidado
 * - XmlComparisonResult: Resultado completo do motor de comparação
 * - FormattedLine: Linha de visualização associada a um path estrutural
 * - LoadedFile: Representação em memória do arquivo original carregado
 *
 * Princípios:
 * - Puramente declarativo: zero algoritmos, zero dependências de DOM ou React;
 * - Nomenclatura consistente: approved / rejected;
 * - Sem atributos visuais ou cores no domínio.
 */

/**
 * Classificação semântica do tipo de divergência entre os documentos XML.
 */
export type DiffKind =
  | "ONLY_IN_APPROVED"
  | "ONLY_IN_REJECTED"
  | "VALUE_DIFF"
  | "ATTRIBUTE_DIFF"
  | "STRUCTURE_DIFF"
  | "CONTEXTUAL_DIFF";

/**
 * Representa uma divergência pontual entre atributos de um mesmo elemento XML.
 *
 * approvedValue === null -> atributo ausente no XML aprovado
 * rejectedValue === null -> atributo ausente no XML rejeitado
 */
export interface AttributeDiffDetail {
  /** Nome do atributo comparado. */
  name: string;

  /** Valor do atributo no documento aprovado, ou null se ausente. */
  approvedValue: string | null;

  /** Valor do atributo no documento rejeitado, ou null se ausente. */
  rejectedValue: string | null;
}

/**
 * Representa uma divergência estrutural ou de valor detectada entre os dois documentos XML.
 */
export interface XmlComparisonDiff {
  /** Identificador determinístico da divergência (ex.: "VALUE_DIFF:/NFSe[1]/toma[1]/CEP[1]"). */
  id: string;

  /** Classificação semântica da divergência. */
  kind: DiffKind;

  /** Caminho estrutural posicional canônico (ex.: "/NFSe[1]/Item[2]/CNPJ[1]"). */
  path: string;

  /** Nome do elemento relacionado à divergência (ex.: "CEP", "infDPS"). */
  tag: string;

  /** Valor textual correspondente no XML aprovado, ou null se ausente. */
  approvedValue: string | null;

  /** Valor textual correspondente no XML rejeitado, ou null se ausente. */
  rejectedValue: string | null;

  /** Divergências de atributos associadas ao elemento (específico de ATTRIBUTE_DIFF). */
  attributes?: AttributeDiffDetail[];

  /** Descrição curta e determinística da divergência (sem inferência causal). */
  detail: string;
}

/**
 * Resumo quantitativo derivado da comparação entre os documentos XML.
 */
export interface XmlComparisonSummary {
  /** Total de elementos presentes exclusivamente no XML aprovado. */
  onlyInApproved: number;

  /** Total de elementos presentes exclusivamente no XML rejeitado. */
  onlyInRejected: number;

  /** Total de diferenças de valor entre elementos correspondentes. */
  valueDiffs: number;

  /** Total de diferenças localizadas em atributos. */
  attributeDiffs: number;

  /** Total de divergências estruturais ou de hierarquia. */
  structureDiffs: number;

  /** Total de diferenças contextuais (contabilizadas separadamente das principais). */
  contextualDiffs: number;

  /** Total de diferenças principais (onlyInApproved + onlyInRejected + valueDiffs + attributeDiffs + structureDiffs). */
  totalDiffs: number;

  /** Indica se os documentos são totalmente idênticos (zero diferenças principais e contextuais). */
  identical: boolean;

  /** Indica se não existem diferenças principais, mas existem diferenças contextuais. */
  hasOnlyContextualDiffs?: boolean;
}

/**
 * Contrato completo do resultado produzido pela comparação entre dois XMLs.
 */
export interface XmlComparisonResult {
  /** Lista ordenada de diferenças detectadas. */
  diffs: XmlComparisonDiff[];

  /** Resumo quantitativo e métricas consolidadas da comparação. */
  summary: XmlComparisonSummary;
}

/**
 * Linha de exibição formatada do XML vinculada a um path estrutural.
 * Utilizada como ponte neutra para sincronização e destaque no viewer.
 */
export interface FormattedLine {
  /** Conteúdo textual da linha formatada. */
  text: string;

  /** Caminho estrutural posicional correspondente à linha, ou null para declarações/sem nó. */
  path: string | null;
}

/**
 * Representação em memória de um documento carregado pela interface.
 * Preserva o conteúdo textual original sem modificações.
 */
export interface LoadedFile {
  /** Nome do arquivo carregado. */
  name: string;

  /** Tamanho do arquivo em bytes. */
  size: number;

  /** Conteúdo textual original completo do documento. */
  text: string;
}
