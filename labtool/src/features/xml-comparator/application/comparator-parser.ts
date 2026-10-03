/**
 * XML Comparator — Parser
 *
 * Responsabilidade:
 * Fronteira técnica entre o XML em texto bruto e a árvore interna normalizada
 * utilizada pelo algoritmo de comparação e visualização estrutural.
 *
 * O que faz:
 * - Valida integridade e segurança do XML antes do parsing (XXE fail-stop e tamanho);
 * - Executa o parsing com DOMParser e valida erros de sintaxe;
 * - Constrói paths estruturais posicionais determinísticos (ex.: /NFSe[1]/Itens[1]/Item[2]/Codigo[1]);
 * - Extrai texto direto de nós folha e atributos preservando namespaces;
 * - Formata linhas para exibição sincronizada no viewer.
 *
 * O que NÃO faz:
 * - Não decide divergências (papel do xml-differ);
 * - Não sanitiza exportações (papel do export-sanitizer);
 * - Não manipula componentes visuais ou React.
 */

import type { FormattedLine } from "../domain";

/**
 * Limite máximo de tamanho do arquivo XML em caracteres (2MB).
 */
export const MAX_XML_LENGTH = 2_000_000;

/**
 * Representação de um atributo XML na árvore interna do comparador.
 */
export interface ComparatorXmlAttribute {
  /** Nome completo do atributo. */
  name: string;

  /** Nome local sem prefixo de namespace. */
  localName: string;

  /** Valor textual do atributo. */
  value: string;

  /** Namespace URI associado, ou null se não declarado. */
  namespaceUri: string | null;
}

/**
 * Nó hierárquico na árvore em memória do comparador.
 */
export interface ComparatorXmlNode {
  /** Caminho estrutural posicional canônico (ex.: /NFSe[1]/infDPS[1]/emit[1]/CNPJ[1]). */
  path: string;

  /** Nome da tag do elemento (nodeName completo). */
  tag: string;

  /** Nome local da tag sem prefixo de namespace. */
  localName: string;

  /** Namespace URI do elemento, ou null se não declarado. */
  namespaceUri: string | null;

  /** Lista de atributos do elemento. */
  attributes: ComparatorXmlAttribute[];

  /** Conteúdo textual direto do elemento (ou null se for puramente estrutural). */
  text: string | null;

  /** Indica se o nó possui nós filhos do tipo ELEMENT_NODE. */
  hasElementChildren: boolean;

  /** Lista ordenada de nós filhos. */
  children: ComparatorXmlNode[];
}

/**
 * Valida a integridade básica e guards de segurança da string XML.
 * Aplica fail-stop para XML vazio, excesso de tamanho e injeção XXE (DOCTYPE / ENTITY).
 */
export function assertSafeXmlSource(xml: string): void {
  if (!xml || typeof xml !== "string" || !xml.trim()) {
    throw new Error("O arquivo XML está vazio.");
  }

  if (xml.length > MAX_XML_LENGTH) {
    throw new Error(
      `O arquivo XML excede o tamanho máximo permitido de ${MAX_XML_LENGTH.toLocaleString("pt-BR")} caracteres.`
    );
  }

  // Guard contra XXE (XML External Entity Injection)
  const upperXml = xml.toUpperCase();
  if (upperXml.includes("<!DOCTYPE") || upperXml.includes("<!ENTITY")) {
    throw new Error(
      "Declarações de DTD/DOCTYPE ou ENTITY não são permitidas por motivos de segurança."
    );
  }
}

/**
 * Normaliza valores textuais para fins de comparação sem alterar o documento original.
 * Remove espaços extras no início/fim e colapsa quebras de linha/espaços múltiplos.
 */
export function normalizeForComparison(value: string): string {
  if (!value) return "";
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Realiza o parsing de uma string XML em um XMLDocument.
 * Lança exceção em caso de XML malformado ou erro retornado pelo DOMParser.
 */
export function parseXml(xml: string): XMLDocument {
  assertSafeXmlSource(xml);

  const parser = new DOMParser();
  const document = parser.parseFromString(xml, "application/xml");

  const parserError = document.querySelector("parsererror");
  if (parserError) {
    const errorText = parserError.textContent || "Erro de sintaxe desconhecido";
    throw new Error(`Erro ao processar estrutura XML: ${errorText.trim()}`);
  }

  if (!document.documentElement) {
    throw new Error("Documento XML não contém elemento raiz.");
  }

  return document;
}

/**
 * Calcula o índice 1-based de um elemento entre os seus irmãos de mesmo nodeName.
 */
function getSameNameIndex(element: Element): number {
  let index = 1;
  let sibling = element.previousElementSibling;

  while (sibling) {
    if (sibling.nodeName === element.nodeName) {
      index++;
    }
    sibling = sibling.previousElementSibling;
  }

  return index;
}

/**
 * Constrói o segmento posicional do elemento (ex.: "Item[2]").
 */
export function buildPathSegment(element: Element): string {
  const index = getSameNameIndex(element);
  return `${element.nodeName}[${index}]`;
}

/**
 * Extrai o texto direto pertencente exclusivamente ao elemento (TEXT_NODE e CDATA_SECTION_NODE).
 * Ignora o texto de elementos descendentes.
 */
function getDirectText(element: Element): string | null {
  const textParts: string[] = [];
  const childNodes = element.childNodes;

  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i];
    if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) {
      textParts.push(node.nodeValue || "");
    }
  }

  const combined = textParts.join("");
  if (combined.length === 0) {
    return "";
  }

  // Se o elemento tiver nós filhos e o texto direto for apenas espaços em branco/indentação, trata como null
  const hasElementSiblings = element.firstElementChild !== null;
  if (hasElementSiblings && combined.trim() === "") {
    return null;
  }

  return combined;
}

/**
 * Constrói recursivamente a árvore hierárquica `ComparatorXmlNode` a partir de um elemento DOM.
 */
export function buildComparatorTree(
  root: XMLDocument | Element,
  parentPath = ""
): ComparatorXmlNode {
  const element = "documentElement" in root ? root.documentElement : root;

  const segment = buildPathSegment(element);
  const currentPath = parentPath ? `${parentPath}/${segment}` : `/${segment}`;

  // Extrair atributos
  const attributes: ComparatorXmlAttribute[] = [];
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes.push({
      name: attr.name,
      localName: attr.localName || attr.name,
      value: attr.value,
      namespaceUri: attr.namespaceURI || null,
    });
  }

  // Processar elementos filhos
  const children: ComparatorXmlNode[] = [];
  const elementChildren = element.children;
  for (let i = 0; i < elementChildren.length; i++) {
    const childElement = elementChildren[i];
    children.push(buildComparatorTree(childElement, currentPath));
  }

  const hasElementChildren = children.length > 0;
  const directText = getDirectText(element);

  return {
    path: currentPath,
    tag: element.nodeName,
    localName: element.localName || element.nodeName,
    namespaceUri: element.namespaceURI || null,
    attributes,
    text: hasElementChildren && directText === null ? null : directText,
    hasElementChildren,
    children,
  };
}

/**
 * Ponto de entrada de conveniência para carregar a árvore interna a partir de string XML.
 */
export function loadComparatorTree(xml: string): ComparatorXmlNode {
  const document = parseXml(xml);
  return buildComparatorTree(document);
}

/**
 * Formata um documento XML em linhas estruturadas associadas aos respectivos paths posicionais.
 * Utilizado pelo visualizador sincronizado e resolução de contexto de diffs.
 */
export function formatXmlToLines(xml: string): FormattedLine[] {
  assertSafeXmlSource(xml);

  const document = parseXml(xml);
  const lines: FormattedLine[] = [];

  // Linha de declaração XML se presente
  const matchDeclaration = xml.match(/^<\?xml[^>]*\?>/i);
  if (matchDeclaration) {
    lines.push({
      text: matchDeclaration[0],
      path: null,
    });
  }

  function formatElement(element: Element, indentLevel: number, parentPath = ""): void {
    const indent = "  ".repeat(indentLevel);
    const segment = buildPathSegment(element);
    const currentPath = parentPath ? `${parentPath}/${segment}` : `/${segment}`;

    const attrs = Array.from(element.attributes)
      .map((a) => `${a.name}="${a.value}"`)
      .join(" ");
    const attrString = attrs ? ` ${attrs}` : "";

    const hasChildren = element.firstElementChild !== null;
    const directText = getDirectText(element);

    if (!hasChildren) {
      if (directText === "" || directText === null) {
        lines.push({
          text: `${indent}<${element.nodeName}${attrString}/>`,
          path: currentPath,
        });
      } else {
        lines.push({
          text: `${indent}<${element.nodeName}${attrString}>${directText}</${element.nodeName}>`,
          path: currentPath,
        });
      }
      return;
    }

    // Elemento container com filhos
    lines.push({
      text: `${indent}<${element.nodeName}${attrString}>`,
      path: currentPath,
    });

    for (let i = 0; i < element.children.length; i++) {
      formatElement(element.children[i], indentLevel + 1, currentPath);
    }

    lines.push({
      text: `${indent}</${element.nodeName}>`,
      path: currentPath,
    });
  }

  formatElement(document.documentElement, 0, "");
  return lines;
}

/**
 * Conta a quantidade real e estrutural de elementos XML (Node.ELEMENT_NODE) em um documento ou árvore.
 *
 * Regras:
 * - Conta exclusivamente nós do tipo elemento (ELEMENT_NODE);
 * - Não conta declaração <?xml... ?>, textos, quebras de linha, comentários, CDATA ou atributos;
 * - Tags de abertura e fechamento de um mesmo elemento contam como 1 único elemento;
 * - Elementos self-closing (<campo/>) contam como 1 elemento;
 * - Namespaces não alteram a contagem (1 elemento com prefixo = 1 elemento);
 * - Elementos repetidos e aninhados contam individualmente.
 */
export function countXmlElements(
  source: XMLDocument | ComparatorXmlNode | string
): number {
  if (!source) return 0;

  if (typeof source === "string") {
    if (!source.trim()) return 0;
    try {
      const doc = parseXml(source);
      return doc.documentElement ? doc.getElementsByTagName("*").length : 0;
    } catch {
      return 0;
    }
  }

  if ("documentElement" in source) {
    return source.documentElement ? source.getElementsByTagName("*").length : 0;
  }

  // Se for ComparatorXmlNode (árvore em memória)
  let count = 1;
  for (const child of source.children) {
    count += countXmlElements(child);
  }
  return count;
}

