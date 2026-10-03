/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * XML Comparator — Export Sanitizer
 *
 * Responsabilidade:
 * Sanitiza e pseudonimiza de forma defensiva dados confidenciais (PIIs e dados fiscais)
 * exclusivamente no momento da exportação de relatórios Markdown do XML Comparator.
 *
 * O que faz:
 * - Mantém um SanitizationContext em memória para garantir consistência relacional
 *   (ex.: o mesmo CNPJ que aparece no Aprovado, Rejeitado e Erro recebe o mesmo [CNPJ_001]);
 * - Higieniza XMLs substituindo nós e atributos sensíveis conforme o catálogo local;
 * - Higieniza JSONs e documentos de texto livre/erros;
 * - Detecta automaticamente o formato de documentos de erro (XML, JSON, texto);
 * - Aplica rigorosamente fail-stop (qualquer erro bloqueia a exportação e nunca expõe o texto original);
 * - Preserva integralmente Inscrição Municipal (IM) e Endereço (CEP, Logradouro, Bairro, Município, UF, etc.)
 *   sem gerar tokens sintéticos nem incrementar contadores.
 *
 * O que NÃO faz:
 * - Não altera os documentos originais em memória ou na visualização da tela;
 * - Não depende da engine do XML Privacy (módulo totalmente independente).
 */

import type {
  ComparisonFieldCategory,
  ErrorDocumentFormat,
  SanitizedExportDocument,
  SanitizationContext,
} from "../domain";
import {
  classifyExportField,
  getExportFieldDefinition,
  shouldSanitizeByDefault,
} from "../catalog";
import { assertSafeXmlSource } from "./comparator-parser";

/**
 * Cria uma nova instância de contexto de sanitização para um ciclo de exportação.
 */
export function createSanitizationContext(): SanitizationContext {
  return {
    mappings: new Map<string, string>(),
    counters: new Map<string, number>(),
  };
}

/**
 * Limpa explicitamente o contexto de sanitização após a exportação (garantia de ciclo de vida).
 */
export function clearSanitizationContext(context: SanitizationContext): void {
  context.mappings.clear();
  context.counters.clear();
}

/**
 * Normaliza um valor para gerar uma chave estável no mapa relacional de mapeamentos.
 */
function normalizeValueKey(
  category: ComparisonFieldCategory,
  originalValue: string
): string {
  const trimmed = originalValue.trim();

  switch (category) {
    case "CPF":
    case "CNPJ": {
      const digitsOnly = trimmed.replace(/\D/g, "");
      return `${category}:${digitsOnly || trimmed}`;
    }
    case "CONTATO":
      return `${category}:${trimmed.toLowerCase()}`;
    default:
      return `${category}:${trimmed}`;
  }
}

/**
 * Obtém o placeholder sintético existente ou cria um novo de forma determinística por categoria.
 * Categorias não sanitizadas por padrão (como INSCRICAO e ENDERECO) retornam o valor original
 * sem criar tokens [ENDERECO_XXX] ou [INSCRICAO_XXX] e sem incrementar contadores.
 *
 * Exemplo:
 * getOrCreateSyntheticValue(ctx, "CNPJ", "11.111.111/0001-11") -> "[CNPJ_001]"
 * getOrCreateSyntheticValue(ctx, "INSCRICAO", "123456")        -> "123456"
 */
export function getOrCreateSyntheticValue(
  context: SanitizationContext,
  category: ComparisonFieldCategory,
  originalValue: string
): string {
  if (!originalValue || typeof originalValue !== "string") {
    return "";
  }

  // Se a categoria não deve ser sanitizada por padrão, preserva o valor original intacto
  if (!shouldSanitizeByDefault(category)) {
    return originalValue;
  }

  const key = normalizeValueKey(category, originalValue);
  const existing = context.mappings.get(key);
  if (existing) {
    return existing;
  }

  const currentCount = context.counters.get(category) ?? 0;
  const nextCount = currentCount + 1;
  context.counters.set(category, nextCount);

  const formattedCount = String(nextCount).padStart(3, "0");
  const placeholder = `[${category}_${formattedCount}]`;

  context.mappings.set(key, placeholder);
  return placeholder;
}

/**
 * Expressões regulares defensivas para scrub de dados sensíveis em texto livre.
 */
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const CNPJ_FORMATTED_REGEX = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g;
const CPF_FORMATTED_REGEX = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
const PHONE_REGEX = /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})[-.\s]?\d{4}\b/g;
const RAW_CNPJ_REGEX = /\b\d{14}\b/g;
const RAW_CPF_REGEX = /\b\d{11}\b/g;

/**
 * Higieniza strings de texto livre (mensagens de erro, logs, observações fiscais)
 * substituindo PIIs reconhecidas por placeholders relacionais consistentes.
 */
export function scrubFreeText(
  text: string,
  context: SanitizationContext
): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  let result = text;

  // 1. E-mails
  result = result.replace(EMAIL_REGEX, (match) =>
    getOrCreateSyntheticValue(context, "CONTATO", match)
  );

  // 2. CNPJ Formatado
  result = result.replace(CNPJ_FORMATTED_REGEX, (match) =>
    getOrCreateSyntheticValue(context, "CNPJ", match)
  );

  // 3. CPF Formatado
  result = result.replace(CPF_FORMATTED_REGEX, (match) =>
    getOrCreateSyntheticValue(context, "CPF", match)
  );

  // 4. Telefones
  result = result.replace(PHONE_REGEX, (match) =>
    getOrCreateSyntheticValue(context, "CONTATO", match)
  );

  // 5. CNPJ Numérico (14 dígitos)
  result = result.replace(RAW_CNPJ_REGEX, (match) =>
    getOrCreateSyntheticValue(context, "CNPJ", match)
  );

  // 6. CPF Numérico (11 dígitos)
  result = result.replace(RAW_CPF_REGEX, (match) =>
    getOrCreateSyntheticValue(context, "CPF", match)
  );

  return result;
}

/**
 * Sanitiza um documento XML para exportação.
 * Lança exceção em caso de erro para garantir fail-stop.
 */
export function sanitizeXmlDocument(
  xmlText: string,
  context: SanitizationContext
): string {
  assertSafeXmlSource(xmlText);

  const parser = new DOMParser();
  const document = parser.parseFromString(xmlText, "application/xml");

  const parserError = document.querySelector("parsererror");
  if (parserError) {
    throw new Error(
      `Erro ao processar XML para sanitização: ${parserError.textContent?.trim() || "XML malformado"}`
    );
  }

  if (!document.documentElement) {
    throw new Error("Documento XML não possui elemento raiz.");
  }

  function processElement(element: Element): void {
    const classification = classifyExportField(element.nodeName);

    // Se o elemento inteiro deve ser removido (ex.: assinaturas digitais <Signature>)
    if (classification.suggestedAction === "REMOVE") {
      element.remove();
      return;
    }

    // 1. Sanitizar atributos
    const attributes = Array.from(element.attributes);
    for (const attr of attributes) {
      if (attr.name.startsWith("xmlns")) {
        continue;
      }

      const attrClassification = classifyExportField(attr.name);
      if (attrClassification.suggestedAction === "PRESERVE") {
        continue;
      }
      if (attrClassification.suggestedAction === "MASK_TOKEN") {
        attr.value = getOrCreateSyntheticValue(
          context,
          attrClassification.category,
          attr.value
        );
      } else if (attrClassification.suggestedAction === "REMOVE") {
        element.removeAttribute(attr.name);
      } else if (attrClassification.suggestedAction === "SCRUB_TEXT") {
        attr.value = scrubFreeText(attr.value, context);
      }
    }

    // 2. Processar filhos e conteúdo
    const hasChildElements = element.firstElementChild !== null;

    if (!hasChildElements) {
      // Elemento folha
      if (classification.suggestedAction === "PRESERVE") {
        // Preserva o conteúdo textual integralmente sem passar por regex scrub
        return;
      }
      if (classification.suggestedAction === "MASK_TOKEN") {
        const directText = element.textContent || "";
        if (directText.trim()) {
          element.textContent = getOrCreateSyntheticValue(
            context,
            classification.category,
            directText
          );
        }
      } else if (classification.suggestedAction === "SCRUB_TEXT") {
        const directText = element.textContent || "";
        if (directText.trim()) {
          element.textContent = scrubFreeText(directText, context);
        }
      }
      return;
    }

    // Elemento container
    const childNodes = Array.from(element.childNodes);
    for (const child of childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        processElement(child as Element);
      } else if (
        child.nodeType === Node.TEXT_NODE ||
        child.nodeType === Node.CDATA_SECTION_NODE
      ) {
        if (child.nodeValue && child.nodeValue.trim()) {
          child.nodeValue = scrubFreeText(child.nodeValue, context);
        }
      } else if (child.nodeType === Node.COMMENT_NODE) {
        // Remover comentários durante exportação por segurança
        child.remove();
      }
    }
  }

  processElement(document.documentElement);

  const serializer = new XMLSerializer();
  return serializer.serializeToString(document);
}

/**
 * Sanitiza um documento JSON para exportação de relatório.
 */
export function sanitizeJsonDocument(
  jsonText: string,
  context: SanitizationContext
): string {
  if (!jsonText || typeof jsonText !== "string") {
    throw new Error("Conteúdo JSON vazio ou inválido.");
  }

  const parsed: unknown = JSON.parse(jsonText);

  function walk(value: unknown, parentKey = ""): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => walk(item, parentKey));
    }

    if (typeof value === "object") {
      const sanitizedObj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        sanitizedObj[k] = walk(v, k);
      }
      return sanitizedObj;
    }

    if (typeof value === "string") {
      if (parentKey) {
        const classification = classifyExportField(parentKey);
        if (classification.suggestedAction === "PRESERVE") {
          return value;
        }
        if (classification.suggestedAction === "MASK_TOKEN") {
          return getOrCreateSyntheticValue(
            context,
            classification.category,
            value
          );
        }
        if (classification.suggestedAction === "SCRUB_TEXT") {
          return scrubFreeText(value, context);
        }
      }
      return scrubFreeText(value, context);
    }

    if (typeof value === "number") {
      if (parentKey) {
        const classification = classifyExportField(parentKey);
        if (classification.suggestedAction === "PRESERVE") {
          return value;
        }
        if (
          classification.suggestedAction === "MASK_TOKEN" &&
          (classification.category === "CPF" || classification.category === "CNPJ")
        ) {
          return getOrCreateSyntheticValue(
            context,
            classification.category,
            String(value)
          );
        }
      }
      return value;
    }

    return value;
  }

  const sanitized = walk(parsed);
  return JSON.stringify(sanitized, null, 2);
}

/**
 * Sanitiza documentos de texto simples (mensagens de erro em texto puro, logs, etc.).
 */
export function sanitizeTextDocument(
  text: string,
  context: SanitizationContext
): string {
  return scrubFreeText(text, context);
}

/**
 * Detecta de forma defensiva o formato estrutural de um documento de erro (XML, JSON ou Texto).
 */
export function detectDocumentFormat(content: string): ErrorDocumentFormat {
  if (!content || typeof content !== "string") {
    return "text";
  }

  const trimmed = content.trim();

  // Testar XML
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(trimmed, "application/xml");
      if (!doc.querySelector("parsererror") && doc.documentElement) {
        return "xml";
      }
    } catch {
      // Falha no parse XML -> tentar JSON/texto
    }
  }

  // Testar JSON
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      // Falha no parse JSON -> tratar como texto
    }
  }

  return "text";
}

/**
 * Sanitiza um documento de retorno ou erro de acordo com o formato detectado.
 * Aplica fail-stop: se ocorrer qualquer erro de sanitização, lança exceção.
 */
export function sanitizeErrorDocument(
  content: string,
  context: SanitizationContext
): SanitizedExportDocument {
  const format = detectDocumentFormat(content);

  switch (format) {
    case "xml": {
      const sanitizedXml = sanitizeXmlDocument(content, context);
      return { format: "xml", content: sanitizedXml };
    }
    case "json": {
      const sanitizedJson = sanitizeJsonDocument(content, context);
      return { format: "json", content: sanitizedJson };
    }
    case "text":
    default: {
      const sanitizedText = sanitizeTextDocument(content, context);
      return { format: "text", content: sanitizedText };
    }
  }
}
