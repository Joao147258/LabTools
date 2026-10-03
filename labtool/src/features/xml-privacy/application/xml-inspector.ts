/**
 * XML Privacy — XML Inspector
 *
 * Responsabilidade:
 * Executa a validação defensiva da string XML, parsing local em memória,
 * percurso completo da árvore de nós (elementos, atributos, comentários, CDATA e texto misto),
 * consulta e enriquecimento contextual com o catálogo de privacidade, retornando
 * a lista ordenada de XmlField para apresentação e posterior sanitização.
 *
 * O que NÃO faz:
 * - Não realiza sanitização, substituição ou scrub de texto no XML;
 * - Não serializa XML de volta para string;
 * - Não faz chamadas de rede ou I/O externo;
 * - Não manipula elementos visuais de UI ou React.
 *
 * Pertence exclusivamente à feature: src/features/xml-privacy/
 */

import type {
  FieldCategory,
  SanitizationAction,
  XmlField,
} from "../domain/sanitization.types";
import {
  classifyTag,
  shouldSelectByDefault,
} from "../catalog/sensitive-tags";
import { parseSafeDocument } from "./xml-parser";

/**
 * Namespace canônico da especificação W3C XML Digital Signature.
 */
const XMLDSIG_NAMESPACE = "http://www.w3.org/2000/09/xmldsig#";

/**
 * Tags pais conhecidas cujos atributos Id representam identificadores fiscais estruturados.
 */
const CONTEXTUAL_ID_PARENT_TAGS = new Set([
  "infdps",
  "infnfse",
  "infnfe",
  "infcte",
  "infmdfe",
  "infcanc",
  "infevento",
]);

/**
 * Verifica se um elemento XML corresponde a um bloco de Assinatura Digital W3C.
 */
function isXmlDigitalSignature(element: Element): boolean {
  const localName = element.localName || element.tagName;
  const namespaceUri = element.namespaceURI;

  return localName === "Signature" && namespaceUri === XMLDSIG_NAMESPACE;
}

/**
 * Calcula a prioridade funcional de um campo para a listagem ordenada.
 *
 * 1. Selecionados automaticamente (não estruturais)
 * 2. Assinatura digital
 * 3. Reconhecidos no catálogo mas não selecionados
 * 4. Desconhecidos (OUTRO, folhas)
 * 5. Elementos estruturais (containers)
 */
function getFieldPriority(field: XmlField): number {
  if (field.category === "ASSINATURA") {
    return 2;
  }
  if (field.selected && !field.hasElementChildren) {
    return 1;
  }
  if (!field.hasElementChildren && field.category !== "OUTRO") {
    return 3;
  }
  if (!field.hasElementChildren && field.category === "OUTRO") {
    return 4;
  }
  return 5;
}

/**
 * Inspeciona recursivamente a árvore do documento XML e gera a lista de XmlFields.
 */
function collectXmlFields(doc: Document): XmlField[] {
  const fields: XmlField[] = [];

  function traverseNode(
    node: Node,
    parentPath: string,
    parentPosition: number[],
    parentTagName: string
  ): void {
    const sameNameTracker = new Map<string, number>();

    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      const currentPosition = [...parentPosition, i];

      // ======================================================================
      // 1. Elementos XML (ELEMENT_NODE)
      // ======================================================================
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element;
        const localName = element.localName || element.tagName;
        const index = (sameNameTracker.get(localName) || 0) + 1;
        sameNameTracker.set(localName, index);

        const currentPath = `${parentPath}/${localName}[${index}]`;
        const elementId = `element:${currentPosition.join(".")}`;
        const isSignature = isXmlDigitalSignature(element);

        // Processar Atributos do Elemento
        if (element.attributes && element.attributes.length > 0) {
          for (let a = 0; a < element.attributes.length; a++) {
            const attr = element.attributes[a];
            const attrName = attr.name;
            const attrNamespace = attr.namespaceURI;

            // Ignorar declarações de namespace xmlns
            if (
              attrName === "xmlns" ||
              attrName.startsWith("xmlns:") ||
              attrNamespace === "http://www.w3.org/2000/xmlns/"
            ) {
              continue;
            }

            const attrPosition = [...currentPosition, a];
            const attrId = `attribute:${currentPosition.join(".")}:${attrName}`;
            const attrPath = `${currentPath}/@${attrName}`;
            const normalizedElement = localName.trim().toLowerCase();
            const normalizedAttr = attrName.trim().toLowerCase();

            let category: FieldCategory;
            let action: SanitizationAction;
            let selected: boolean;

            // Regra Contextual: infDPS/@Id, infNFSe/@Id, etc.
            if (normalizedAttr === "id" && CONTEXTUAL_ID_PARENT_TAGS.has(normalizedElement)) {
              category = "IDENTIFICADOR_DPS";
              action = "REPLACE";
              selected = true;
            } else {
              const classification = classifyTag(attrName);
              category = classification.category;
              action = classification.suggestedAction;
              selected = shouldSelectByDefault(category);
            }

            fields.push({
              id: attrId,
              tag: `@${attrName}`,
              path: attrPath,
              value: attr.value,
              namespaceUri: attr.namespaceURI || null,
              category,
              kind: "attribute",
              action,
              selected,
              hasElementChildren: false,
              position: attrPosition,
            });
          }
        }

        // Processar Elemento (Assinatura, Estrutura ou Folha)
        if (isSignature) {
          fields.push({
            id: `signature:${currentPosition.join(".")}`,
            tag: localName,
            path: currentPath,
            value: "[Assinatura Digital XMLDSig]",
            namespaceUri: element.namespaceURI || XMLDSIG_NAMESPACE,
            category: "ASSINATURA",
            kind: "element",
            action: "REMOVE_SUBTREE",
            selected: true,
            hasElementChildren: element.children.length > 0,
            position: currentPosition,
          });
        } else if (element.children.length > 0) {
          // Elemento Estrutural (container de outros elementos)
          fields.push({
            id: elementId,
            tag: localName,
            path: currentPath,
            value: `[ESTRUTURA: ${element.children.length} elemento(s)]`,
            namespaceUri: element.namespaceURI || null,
            category: "OUTRO",
            kind: "element",
            action: "PRESERVE",
            selected: false,
            hasElementChildren: true,
            position: currentPosition,
          });

          // Continuar percurso nos filhos do elemento estrutural
          traverseNode(element, currentPath, currentPosition, localName);
        } else {
          // Elemento Folha
          let hasCdata = false;
          let cdataContent = "";

          for (let c = 0; c < element.childNodes.length; c++) {
            const leafChild = element.childNodes[c];
            if (leafChild.nodeType === Node.CDATA_SECTION_NODE) {
              hasCdata = true;
              cdataContent = leafChild.nodeValue || "";
              break;
            }
          }

          const rawValue = hasCdata ? cdataContent : (element.textContent || "");
          const value = rawValue.trim();

          const classification = classifyTag(localName);
          const category = classification.category;
          const action = classification.suggestedAction;
          const selected = shouldSelectByDefault(category);

          fields.push({
            id: elementId,
            tag: localName,
            path: currentPath,
            value,
            namespaceUri: element.namespaceURI || null,
            category,
            kind: "element",
            action,
            selected,
            hasElementChildren: false,
            position: currentPosition,
          });
        }
      }

      // ======================================================================
      // 2. Comentários (COMMENT_NODE)
      // ======================================================================
      else if (child.nodeType === Node.COMMENT_NODE) {
        const commentIndex = (sameNameTracker.get("#comment") || 0) + 1;
        sameNameTracker.set("#comment", commentIndex);

        const commentPath = `${parentPath}/#comment[${commentIndex}]`;
        const commentId = `comment:${currentPosition.join(".")}`;
        const commentValue = child.nodeValue || "";

        fields.push({
          id: commentId,
          tag: "#comment",
          path: commentPath,
          value: commentValue,
          namespaceUri: null,
          category: "TEXTO_LIVRE",
          kind: "comment",
          action: "REMOVE_SUBTREE",
          selected: true,
          hasElementChildren: false,
          position: currentPosition,
        });
      }

      // ======================================================================
      // 3. CDATA solto ou sob estrutura (CDATA_SECTION_NODE)
      // ======================================================================
      else if (child.nodeType === Node.CDATA_SECTION_NODE) {
        const cdataIndex = (sameNameTracker.get("#cdata") || 0) + 1;
        sameNameTracker.set("#cdata", cdataIndex);

        const cdataPath = `${parentPath}/#cdata[${cdataIndex}]`;
        const cdataId = `cdata:${currentPosition.join(".")}`;
        const cdataValue = child.nodeValue || "";

        fields.push({
          id: cdataId,
          tag: "#cdata",
          path: cdataPath,
          value: cdataValue,
          namespaceUri: null,
          category: "TEXTO_LIVRE",
          kind: "cdata",
          action: "SCRUB_TEXT",
          selected: true,
          hasElementChildren: false,
          position: currentPosition,
        });
      }

      // ======================================================================
      // 4. Texto Misto sob Elemento Estrutural (TEXT_NODE)
      // ======================================================================
      else if (child.nodeType === Node.TEXT_NODE) {
        const textValue = child.nodeValue?.trim() || "";
        if (textValue.length > 0) {
          const textIndex = (sameNameTracker.get("#text") || 0) + 1;
          sameNameTracker.set("#text", textIndex);

          const textPath = `${parentPath}/#text[${textIndex}]`;
          const textId = `text:${currentPosition.join(".")}`;

          const parentClassification = classifyTag(parentTagName);
          const category: FieldCategory =
            parentClassification.category === "OUTRO"
              ? "TEXTO_LIVRE"
              : parentClassification.category;

          fields.push({
            id: textId,
            tag: "#text",
            path: textPath,
            value: textValue,
            namespaceUri: null,
            category,
            kind: "text",
            action: "SCRUB_TEXT",
            selected: true,
            hasElementChildren: false,
            position: currentPosition,
          });
        }
      }
    }
  }

  if (doc.documentElement) {
    const rootEl = doc.documentElement;
    const rootName = rootEl.localName || rootEl.tagName;
    const rootPath = `/${rootName}[1]`;
    const rootPosition = [0];

    // Se o elemento raiz possuir atributos
    if (rootEl.attributes && rootEl.attributes.length > 0) {
      for (let a = 0; a < rootEl.attributes.length; a++) {
        const attr = rootEl.attributes[a];
        if (
          attr.name === "xmlns" ||
          attr.name.startsWith("xmlns:") ||
          attr.namespaceURI === "http://www.w3.org/2000/xmlns/"
        ) {
          continue;
        }
        const attrPosition = [...rootPosition, a];
        const attrId = `attribute:0:${attr.name}`;
        const attrPath = `${rootPath}/@${attr.name}`;
        const normalizedRoot = rootName.trim().toLowerCase();
        const normalizedAttr = attr.name.trim().toLowerCase();

        let category: FieldCategory;
        let action: SanitizationAction;
        let selected: boolean;

        if (normalizedAttr === "id" && CONTEXTUAL_ID_PARENT_TAGS.has(normalizedRoot)) {
          category = "IDENTIFICADOR_DPS";
          action = "REPLACE";
          selected = true;
        } else {
          const classification = classifyTag(attr.name);
          category = classification.category;
          action = classification.suggestedAction;
          selected = shouldSelectByDefault(category);
        }

        fields.push({
          id: attrId,
          tag: `@${attr.name}`,
          path: attrPath,
          value: attr.value,
          namespaceUri: attr.namespaceURI || null,
          category,
          kind: "attribute",
          action,
          selected,
          hasElementChildren: false,
          position: attrPosition,
        });
      }
    }

    // Se a raiz tiver elementos filhos
    if (rootEl.children.length > 0) {
      fields.push({
        id: "element:0",
        tag: rootName,
        path: rootPath,
        value: `[ESTRUTURA: ${rootEl.children.length} elemento(s)]`,
        namespaceUri: rootEl.namespaceURI || null,
        category: "OUTRO",
        kind: "element",
        action: "PRESERVE",
        selected: false,
        hasElementChildren: true,
        position: rootPosition,
      });

      traverseNode(rootEl, rootPath, rootPosition, rootName);
    } else {
      // Raiz folha
      const classification = classifyTag(rootName);
      const category = classification.category;
      const action = classification.suggestedAction;
      const selected = shouldSelectByDefault(category);

      fields.push({
        id: "element:0",
        tag: rootName,
        path: rootPath,
        value: rootEl.textContent?.trim() || "",
        namespaceUri: rootEl.namespaceURI || null,
        category,
        kind: "element",
        action,
        selected,
        hasElementChildren: false,
        position: rootPosition,
      });
    }
  }

  return fields;
}

/**
 * Função principal de inspeção do XML Privacy.
 *
 * Recebe a string de um documento XML, executa validações defensivas,
 * realiza o parsing local, percorre a hierarquia completa e retorna
 * os campos classificados e ordenados por prioridade.
 */
export function inspectXml(xml: string): XmlField[] {
  const doc = parseSafeDocument(xml);
  const fields = collectXmlFields(doc);

  // Ordenação estável por prioridade funcional
  return fields.sort((a, b) => {
    const priorityA = getFieldPriority(a);
    const priorityB = getFieldPriority(b);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Desempate estável pela ordem de posição estrutural no documento
    const maxLen = Math.max(a.position.length, b.position.length);
    for (let i = 0; i < maxLen; i++) {
      const posA = a.position[i] ?? -1;
      const posB = b.position[i] ?? -1;
      if (posA !== posB) {
        return posA - posB;
      }
    }

    return a.id.localeCompare(b.id);
  });
}
