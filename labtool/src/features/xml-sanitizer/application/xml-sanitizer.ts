/**
 * XML Privacy — XML Sanitizer Orchestrator
 *
 * Responsabilidade:
 * Receber a string original do XML e a lista de XmlField (com as ações e seleções
 * definidas pelo usuário ou catálogo), instanciar um novo DOM em memória de forma segura,
 * aplicar as mutações selecionadas (REPLACE, SCRUB_TEXT, REMOVE_SUBTREE) de forma
 * determinística e retornar o SanitizationResult contendo o XML sanitizado e o sumário.
 *
 * O que NÃO faz:
 * - Não inspeciona nem classifica tags (responsabilidade do xml-inspector.ts);
 * - Não manipula componentes React ou estado visual;
 * - Não faz chamadas de rede ou I/O externo.
 *
 * Pertence exclusivamente à feature: src/features/xml-privacy/
 */

import type {
  FieldCategory,
  SanitizationResult,
  SanitizationSummary,
  XmlField,
} from "../domain/sanitization.types";
import { scrubText } from "./text-scrub";
import { parseSafeDocument } from "./xml-parser";

/**
 * Gerador determinístico de tokens de substituição para a sessão de sanitização.
 */
class ReplacementGenerator {
  private readonly replacements = new Map<string, string>();
  private readonly counters = new Map<FieldCategory, number>();

  public getReplacement(category: FieldCategory, originalValue: string): string {
    const key = `${category}:${originalValue}`;
    const existing = this.replacements.get(key);
    if (existing) {
      return existing;
    }

    const nextCount = (this.counters.get(category) || 0) + 1;
    this.counters.set(category, nextCount);

    const token = `[${category}_${String(nextCount).padStart(3, "0")}]`;
    this.replacements.set(key, token);
    return token;
  }
}

/**
 * Localiza o nó alvo no documento recém-parseado utilizando o array de posições.
 */
function resolveNodeByPosition(doc: Document, position: number[]): Node | null {
  if (!doc.documentElement || position.length === 0) {
    return null;
  }

  let current: Node = doc.documentElement;

  for (let i = 1; i < position.length; i++) {
    const childIndex = position[i];
    if (!current.childNodes || childIndex >= current.childNodes.length) {
      return null;
    }
    current = current.childNodes[childIndex];
  }

  return current;
}

/**
 * Localiza o nó alvo ou atributo a partir do XmlField no documento limpo.
 */
function resolveTarget(
  doc: Document,
  field: XmlField
): { node: Node; attr?: Attr; element?: Element } | null {
  if (field.kind === "attribute") {
    // Para atributos, a posição do elemento pai é o prefixo de position (todos menos o índice do atributo)
    const elementPosition = field.position.slice(0, -1);
    const elementNode = resolveNodeByPosition(doc, elementPosition);

    if (!elementNode || elementNode.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const element = elementNode as Element;
    const attrName = field.tag.replace(/^@/, "");
    const attr = element.getAttributeNode(attrName) || undefined;

    return { node: element, attr, element };
  }

  const node = resolveNodeByPosition(doc, field.position);
  if (!node) {
    return null;
  }

  return { node, element: node.nodeType === Node.ELEMENT_NODE ? (node as Element) : undefined };
}

/**
 * Serializa o documento XML sanitizado preservando a declaração XML inicial, se existente.
 */
function serializeSanitizedDocument(doc: Document, originalXml: string): string {
  const serializer = new XMLSerializer();
  const serialized = serializer.serializeToString(doc);

  const xmlDeclMatch = originalXml.trim().match(/^<\?xml[^>]*\?>/i);
  if (xmlDeclMatch && !serialized.startsWith("<?xml")) {
    return `${xmlDeclMatch[0]}\n${serialized}`;
  }

  return serialized;
}

/**
 * Orquestra a sanitização completa de um documento XML a partir da lista de XmlField.
 */
export function sanitizeXml(
  xml: string,
  fields: readonly XmlField[]
): SanitizationResult {
  try {
    const doc = parseSafeDocument(xml);
    const generator = new ReplacementGenerator();
    const replaceCallback = (category: FieldCategory, val: string) =>
      generator.getReplacement(category, val);

    let fieldsSanitized = 0;
    let fieldsReplaced = 0;
    let fieldsScrubbed = 0;
    let subtreesRemoved = 0;

    // 1. Resolver previamente referências a nós antes de efetuar mutações
    // Isso evita problemas de deslocamento de índices em childNodes durante remoções
    interface ResolvedTarget {
      field: XmlField;
      node: Node;
      attr?: Attr;
      element?: Element;
    }

    const resolvedTargets: ResolvedTarget[] = [];

    for (const field of fields) {
      if (!field.selected || field.action === "PRESERVE") {
        continue;
      }

      const target = resolveTarget(doc, field);
      if (target) {
        resolvedTargets.push({
          field,
          node: target.node,
          attr: target.attr,
          element: target.element,
        });
      }
    }

    // 2. Aplicar mutações sobre os alvos resolvidos
    for (const item of resolvedTargets) {
      const { field, node, attr, element } = item;

      // ======================================================================
      // Ação: REMOVE_SUBTREE
      // ======================================================================
      if (field.action === "REMOVE_SUBTREE") {
        if (field.kind === "attribute" && element) {
          const attrName = field.tag.replace(/^@/, "");
          if (element.hasAttribute(attrName)) {
            element.removeAttribute(attrName);
            subtreesRemoved++;
            fieldsSanitized++;
          }
        } else if (node.parentNode) {
          node.parentNode.removeChild(node);
          subtreesRemoved++;
          fieldsSanitized++;
        }
        continue;
      }

      // Se o nó deixou de pertencer à árvore ativa (devido à remoção de um elemento pai), ignorar
      if (!doc.contains(node)) {
        continue;
      }

      // ======================================================================
      // Ação: REPLACE
      // ======================================================================
      if (field.action === "REPLACE") {
        const replacementToken = generator.getReplacement(field.category, field.value);

        if (field.kind === "attribute" && element) {
          const attrName = field.tag.replace(/^@/, "");
          element.setAttribute(attrName, replacementToken);
          fieldsReplaced++;
          fieldsSanitized++;
        } else if (field.kind === "text") {
          node.nodeValue = replacementToken;
          fieldsReplaced++;
          fieldsSanitized++;
        } else if (field.kind === "comment") {
          node.nodeValue = replacementToken;
          fieldsReplaced++;
          fieldsSanitized++;
        } else if (field.kind === "cdata") {
          (node as CharacterData).data = replacementToken;
          fieldsReplaced++;
          fieldsSanitized++;
        } else if (field.kind === "element" && !field.hasElementChildren && element) {
          // Elemento folha: verificar se possui seção CDATA
          let hasCdata = false;
          for (let c = 0; c < element.childNodes.length; c++) {
            const childNode = element.childNodes[c];
            if (childNode.nodeType === Node.CDATA_SECTION_NODE) {
              (childNode as CharacterData).data = replacementToken;
              hasCdata = true;
              break;
            }
          }
          if (!hasCdata) {
            element.textContent = replacementToken;
          }
          fieldsReplaced++;
          fieldsSanitized++;
        }
        continue;
      }

      // ======================================================================
      // Ação: SCRUB_TEXT
      // ======================================================================
      if (field.action === "SCRUB_TEXT") {
        if (field.kind === "attribute" && element && attr) {
          const scrubbed = scrubText(attr.value, replaceCallback);
          element.setAttribute(attr.name, scrubbed);
          fieldsScrubbed++;
          fieldsSanitized++;
        } else if (field.kind === "text") {
          const scrubbed = scrubText(node.nodeValue || "", replaceCallback);
          node.nodeValue = scrubbed;
          fieldsScrubbed++;
          fieldsSanitized++;
        } else if (field.kind === "comment") {
          const scrubbed = scrubText(node.nodeValue || "", replaceCallback);
          node.nodeValue = scrubbed;
          fieldsScrubbed++;
          fieldsSanitized++;
        } else if (field.kind === "cdata") {
          const scrubbed = scrubText((node as CharacterData).data || "", replaceCallback);
          (node as CharacterData).data = scrubbed;
          fieldsScrubbed++;
          fieldsSanitized++;
        } else if (field.kind === "element" && !field.hasElementChildren && element) {
          // Elemento folha com CDATA ou texto
          let hasCdata = false;
          for (let c = 0; c < element.childNodes.length; c++) {
            const childNode = element.childNodes[c];
            if (childNode.nodeType === Node.CDATA_SECTION_NODE) {
              const scrubbed = scrubText(
                (childNode as CharacterData).data || "",
                replaceCallback
              );
              (childNode as CharacterData).data = scrubbed;
              hasCdata = true;
              break;
            }
          }
          if (!hasCdata) {
            const scrubbed = scrubText(element.textContent || "", replaceCallback);
            element.textContent = scrubbed;
          }
          fieldsScrubbed++;
          fieldsSanitized++;
        }
      }
    }

    const sanitizedXml = serializeSanitizedDocument(doc, xml);

    const summary: SanitizationSummary = {
      fieldsFound: fields.length,
      fieldsSanitized,
      fieldsReplaced,
      fieldsScrubbed,
      subtreesRemoved,
    };

    return {
      success: true,
      sanitizedXml,
      summary,
      fields: [...fields],
      errors: [],
    };
  } catch (error) {
    return {
      success: false,
      sanitizedXml: "",
      summary: {
        fieldsFound: fields?.length || 0,
        fieldsSanitized: 0,
        fieldsReplaced: 0,
        fieldsScrubbed: 0,
        subtreesRemoved: 0,
      },
      fields: fields ? [...fields] : [],
      errors: [error instanceof Error ? error.message : "Erro desconhecido durante sanitização."],
    };
  }
}
