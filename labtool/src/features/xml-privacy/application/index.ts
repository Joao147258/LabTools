/**
 * XML Privacy — Application Layer
 *
 * Expõe exclusivamente os pontos de entrada públicos do motor do XML Privacy:
 * - inspectXml: Validação e inspeção estrutural de campos;
 * - sanitizeXml: Orquestração de sanitização, mutação e sumarização.
 */

export { inspectXml } from "./xml-inspector";
export { sanitizeXml } from "./xml-sanitizer";
export { MAX_XML_SIZE_BYTES, parseSafeDocument, assertSafeXmlSource } from "./xml-parser";
