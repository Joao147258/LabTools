/**
 * XML Comparator — Domain Layer
 *
 * Ponto de entrada consolidado da camada de domínio da feature XML Comparator.
 * Reexporta exclusivamente contratos e tipos puros sem dependências externas.
 */

export type {
  DiffKind,
  AttributeDiffDetail,
  XmlComparisonDiff,
  XmlComparisonSummary,
  XmlComparisonResult,
  FormattedLine,
  LoadedFile,
} from "./comparison.types";

export type {
  ComparisonFieldCategory,
  SanitizationContext,
  ErrorDocumentFormat,
  SanitizedExportDocument,
  ComparisonExportInput,
  ComparisonExportResult,
} from "./export.types";
