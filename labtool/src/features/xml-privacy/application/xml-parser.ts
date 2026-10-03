/**
 * XML Privacy — Safe XML Parser & Defensive Guards
 *
 * Responsabilidade:
 * Centralizar a política de validação defensiva e o parsing seguro de strings XML
 * em objetos Document DOM em memória para a feature XML Privacy.
 *
 * O que NÃO faz:
 * - Não realiza inspeção nem classificação de campos;
 * - Não aplica mutações de sanitização;
 * - Não faz chamadas de rede ou I/O externo.
 *
 * Pertence exclusivamente à feature: src/features/xml-privacy/application/
 */

/**
 * Limite defensivo canônico de tamanho da string XML (20MB).
 * Protege a aplicação contra exaustão de memória e ataques de negação de serviço no cliente.
 */
export const MAX_XML_SIZE_BYTES = 20 * 1024 * 1024;

/**
 * Validação prévia e defensiva do conteúdo XML antes do envio ao parser nativo.
 *
 * Bloqueia:
 * 1. Strings vazias ou compostas exclusivamente por espaços em branco;
 * 2. Cargas úteis que excedam o limite defensivo de 20MB;
 * 3. Declarações de DTD externo (DOCTYPE) e entidades (ENTITY) para prevenção de ataques XXE.
 */
export function assertSafeXmlSource(xml: string): void {
  if (!xml || typeof xml !== "string" || !xml.trim()) {
    throw new Error("XML vazio ou inválido.");
  }

  if (xml.length > MAX_XML_SIZE_BYTES) {
    throw new Error("XML excede o limite defensivo permitido de 20MB.");
  }

  // Bloqueio rigoroso de DTD externo e expansão de entidades (XXE prevention)
  if (/<!DOCTYPE/i.test(xml)) {
    throw new Error("Declarações de DOCTYPE não são permitidas por motivos de segurança.");
  }

  if (/<!ENTITY/i.test(xml)) {
    throw new Error("Declarações de ENTITY não são permitidas por motivos de segurança.");
  }
}

/**
 * Realiza o parsing seguro da string XML utilizando a API nativa DOMParser.
 * Lança erro explícito se o documento for malformado ou se houver erros de sintaxe.
 */
export function parseSafeDocument(xml: string): Document {
  assertSafeXmlSource(xml);

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");

  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error(
      `XML malformado: ${parserError.textContent?.trim() || "erro de parsing desconhecido."}`
    );
  }

  if (!doc.documentElement) {
    throw new Error("Documento XML inválido: elemento raiz não encontrado.");
  }

  if (doc.doctype) {
    throw new Error("Declarações DTD/DOCTYPE detectadas após parsing.");
  }

  return doc;
}
