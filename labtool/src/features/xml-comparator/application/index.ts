/**
 * XML Comparator — Application Layer
 *
 * Ponto de entrada consolidado dos casos de uso, motores de comparação,
 * resolução de contexto e exportação da feature XML Comparator.
 */

export {
  MAX_XML_LENGTH,
  assertSafeXmlSource,
  parseXml,
  buildPathSegment,
  buildComparatorTree,
  loadComparatorTree,
  normalizeForComparison,
  formatXmlToLines,
  countXmlElements,
} from "./comparator-parser";

export type {
  ComparatorXmlNode,
  ComparatorXmlAttribute,
} from "./comparator-parser";

export {
  compareXmlTrees,
} from "./xml-differ";

export {
  normalizeTagOrSegment,
  extractPathSegments,
  TOMADOR_SCOPES,
  PRESTADOR_SCOPES,
  LOCATION_PRIMARY_FIELDS,
  FISCAL_PRIMARY_FIELDS,
  DOCUMENT_CONTEXTUAL_FIELDS,
  TOMADOR_CADASTRAL_FIELDS,
  EXPLICIT_TOMADOR_TAGS,
  DOCUMENT_ID_CONTAINERS,
  isInsidePrestadorScope,
  isInsideTomadorScope,
  isContextualTag,
  isContextualAttribute,
  classifyValueDiff,
  classifyAttributeDiff,
} from "./diff-classifier";

export {
  getParentPath,
  findLineIndexByPath,
  resolveDiffContext,
} from "./diff-context";

export type {
  DiffContext,
} from "./diff-context";

export {
  createSanitizationContext,
  clearSanitizationContext,
  getOrCreateSyntheticValue,
  scrubFreeText,
  sanitizeXmlDocument,
  sanitizeJsonDocument,
  sanitizeTextDocument,
  detectDocumentFormat,
  sanitizeErrorDocument,
} from "./export-sanitizer";

export {
  exportComparisonToMarkdown,
} from "./markdown-exporter";
