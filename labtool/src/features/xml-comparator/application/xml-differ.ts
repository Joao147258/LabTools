/**
 * XML Comparator — Differ Engine
 *
 * Responsabilidade:
 * Executa a comparação estrutural profunda e determinística entre duas árvores
 * XML normalizadas (XML Aprovado vs XML Rejeitado).
 *
 * O que faz:
 * - Compara nós raiz, hierarquia, atributos e valores de elementos folha;
 * - Detecta inclusões (ONLY_IN_APPROVED), remoções (ONLY_IN_REJECTED), alterações de valor (VALUE_DIFF),
 *   alterações de atributos (ATTRIBUTE_DIFF) e incompatibilidades estruturais (STRUCTURE_DIFF);
 * - Normaliza espaços em branco e quebras de linha para evitar falsos positivos de formatação;
 * - Produz identificadores determinísticos para cada divergência;
 * - Consolida o resumo quantitativo (XmlComparisonSummary) e status de equivalência.
 *
 * O que NÃO faz:
 * - Não realiza parsing do DOM diretamente (recebe ComparatorXmlNode);
 * - Não sanitiza nem gera Markdown;
 * - Não infere causalidade fiscal ou razões arbitrárias de rejeição.
 */

import type {
  AttributeDiffDetail,
  XmlComparisonDiff,
  XmlComparisonResult,
  XmlComparisonSummary,
} from "../domain";
import {
  normalizeForComparison,
  type ComparatorXmlNode,
  type ComparatorXmlAttribute,
} from "./comparator-parser";
import {
  classifyValueDiff,
  isContextualAttribute,
} from "./diff-classifier";

/**
 * Compara os atributos de dois nós correspondentes e retorna os detalhes das diferenças encontradas.
 */
function diffAttributes(
  approved: ComparatorXmlNode,
  rejected: ComparatorXmlNode
): AttributeDiffDetail[] {
  const details: AttributeDiffDetail[] = [];

  const approvedMap = new Map<string, ComparatorXmlAttribute>();
  for (const attr of approved.attributes) {
    approvedMap.set(attr.name, attr);
  }

  const rejectedMap = new Map<string, ComparatorXmlAttribute>();
  for (const attr of rejected.attributes) {
    rejectedMap.set(attr.name, attr);
  }

  // Verificar atributos do aprovado
  for (const [name, approvedAttr] of approvedMap.entries()) {
    const rejectedAttr = rejectedMap.get(name);
    if (!rejectedAttr) {
      details.push({
        name,
        approvedValue: approvedAttr.value,
        rejectedValue: null,
      });
    } else if (approvedAttr.value !== rejectedAttr.value) {
      // Verificar se valores diferem mesmo após normalização
      const normApp = normalizeForComparison(approvedAttr.value);
      const normRej = normalizeForComparison(rejectedAttr.value);
      if (normApp !== normRej) {
        details.push({
          name,
          approvedValue: approvedAttr.value,
          rejectedValue: rejectedAttr.value,
        });
      }
    }
  }

  // Verificar atributos presentes apenas no rejeitado
  for (const [name, rejectedAttr] of rejectedMap.entries()) {
    if (!approvedMap.has(name)) {
      details.push({
        name,
        approvedValue: null,
        rejectedValue: rejectedAttr.value,
      });
    }
  }

  return details;
}

/**
 * Cria uma divergência para elementos exclusivos (presentes somente em um dos documentos).
 */
function createExclusiveDiff(
  node: ComparatorXmlNode,
  kind: "ONLY_IN_APPROVED" | "ONLY_IN_REJECTED"
): XmlComparisonDiff {
  const isApproved = kind === "ONLY_IN_APPROVED";
  const approvedVal = isApproved ? node.text ?? (node.hasElementChildren ? "[Estrutura]" : "") : null;
  const rejectedVal = !isApproved ? node.text ?? (node.hasElementChildren ? "[Estrutura]" : "") : null;

  return {
    id: `${kind}:${node.path}`,
    kind,
    path: node.path,
    tag: node.tag,
    approvedValue: approvedVal,
    rejectedValue: rejectedVal,
    detail: isApproved
      ? `Elemento <${node.tag}> presente exclusivamente no XML aprovado.`
      : `Elemento <${node.tag}> presente exclusivamente no XML rejeitado.`,
  };
}

/**
 * Coleta recursivamente todas as divergências de elementos exclusivos de uma subárvore.
 */
function collectExclusiveSubtree(
  node: ComparatorXmlNode,
  kind: "ONLY_IN_APPROVED" | "ONLY_IN_REJECTED",
  diffs: XmlComparisonDiff[]
): void {
  diffs.push(createExclusiveDiff(node, kind));
  for (const child of node.children) {
    collectExclusiveSubtree(child, kind, diffs);
  }
}

/**
 * Compara recursivamente dois nós XML correspondentes.
 */
function compareNodes(
  approved: ComparatorXmlNode,
  rejected: ComparatorXmlNode,
  diffs: XmlComparisonDiff[]
): void {
  // 1. Comparar atributos
  const attrDetails = diffAttributes(approved, rejected);
  if (attrDetails.length > 0) {
    const contextualAttrs: AttributeDiffDetail[] = [];
    const primaryAttrs: AttributeDiffDetail[] = [];

    for (const attr of attrDetails) {
      if (isContextualAttribute(approved.tag, attr.name, approved.path)) {
        contextualAttrs.push(attr);
      } else {
        primaryAttrs.push(attr);
      }
    }

    if (contextualAttrs.length > 0) {
      const attrNames = contextualAttrs.map((a) => a.name).join(", ");
      diffs.push({
        id: `CONTEXTUAL_DIFF:${approved.path}`,
        kind: "CONTEXTUAL_DIFF",
        path: approved.path,
        tag: approved.tag,
        approvedValue: contextualAttrs
          .map((a) => (a.approvedValue !== null ? `${a.name}="${a.approvedValue}"` : null))
          .filter(Boolean)
          .join(" ") || null,
        rejectedValue: contextualAttrs
          .map((a) => (a.rejectedValue !== null ? `${a.name}="${a.rejectedValue}"` : null))
          .filter(Boolean)
          .join(" ") || null,
        attributes: contextualAttrs,
        detail: `Divergência contextual em atributo(s) do elemento <${approved.tag}>: ${attrNames}.`,
      });
    }

    if (primaryAttrs.length > 0) {
      const attrNames = primaryAttrs.map((a) => a.name).join(", ");
      diffs.push({
        id: `ATTRIBUTE_DIFF:${approved.path}`,
        kind: "ATTRIBUTE_DIFF",
        path: approved.path,
        tag: approved.tag,
        approvedValue: primaryAttrs
          .map((a) => (a.approvedValue !== null ? `${a.name}="${a.approvedValue}"` : null))
          .filter(Boolean)
          .join(" ") || null,
        rejectedValue: primaryAttrs
          .map((a) => (a.rejectedValue !== null ? `${a.name}="${a.rejectedValue}"` : null))
          .filter(Boolean)
          .join(" ") || null,
        attributes: primaryAttrs,
        detail: `Divergência em atributo(s) do elemento <${approved.tag}>: ${attrNames}.`,
      });
    }
  }

  // 2. Comparar compatibilidade estrutural (folha vs container)
  if (approved.hasElementChildren !== rejected.hasElementChildren) {
    diffs.push({
      id: `STRUCTURE_DIFF:${approved.path}`,
      kind: "STRUCTURE_DIFF",
      path: approved.path,
      tag: approved.tag,
      approvedValue: approved.text ?? (approved.hasElementChildren ? "[Nós Filhos]" : ""),
      rejectedValue: rejected.text ?? (rejected.hasElementChildren ? "[Nós Filhos]" : ""),
      detail: `Incompatibilidade estrutural no elemento <${approved.tag}>: um dos documentos possui subelementos enquanto o outro é folha de texto.`,
    });
    return;
  }

  // 3. Se ambos forem folhas, comparar valores de texto
  if (!approved.hasElementChildren && !rejected.hasElementChildren) {
    const appText = approved.text ?? "";
    const rejText = rejected.text ?? "";

    if (appText !== rejText) {
      const normApp = normalizeForComparison(appText);
      const normRej = normalizeForComparison(rejText);

      if (normApp !== normRej) {
        const kind = classifyValueDiff(approved.tag, approved.path);
        const isContextual = kind === "CONTEXTUAL_DIFF";

        diffs.push({
          id: `${kind}:${approved.path}`,
          kind,
          path: approved.path,
          tag: approved.tag,
          approvedValue: approved.text,
          rejectedValue: rejected.text,
          detail: isContextual
            ? `Divergência contextual no elemento <${approved.tag}>.`
            : `Valor divergente no elemento <${approved.tag}>.`,
        });
      }
    }
    return;
  }

  // 4. Se ambos forem containers, alinhar filhos por path posicional
  const approvedChildrenByPath = new Map<string, ComparatorXmlNode>();
  for (const child of approved.children) {
    approvedChildrenByPath.set(child.path, child);
  }

  const rejectedChildrenByPath = new Map<string, ComparatorXmlNode>();
  for (const child of rejected.children) {
    rejectedChildrenByPath.set(child.path, child);
  }

  // Percorrer filhos do aprovado
  for (const approvedChild of approved.children) {
    const rejectedChild = rejectedChildrenByPath.get(approvedChild.path);

    if (!rejectedChild) {
      collectExclusiveSubtree(approvedChild, "ONLY_IN_APPROVED", diffs);
    } else if (approvedChild.tag !== rejectedChild.tag) {
      // Tags divergentes no mesmo path posicional
      diffs.push({
        id: `STRUCTURE_DIFF:${approvedChild.path}`,
        kind: "STRUCTURE_DIFF",
        path: approvedChild.path,
        tag: `${approvedChild.tag} / ${rejectedChild.tag}`,
        approvedValue: `<${approvedChild.tag}>`,
        rejectedValue: `<${rejectedChild.tag}>`,
        detail: `Tag divergente na mesma posição hierárquica: esperado <${approvedChild.tag}> no aprovado, mas encontrado <${rejectedChild.tag}> no rejeitado.`,
      });
    } else {
      compareNodes(approvedChild, rejectedChild, diffs);
    }
  }

  // Percorrer filhos presentes exclusivamente no rejeitado
  for (const rejectedChild of rejected.children) {
    if (!approvedChildrenByPath.has(rejectedChild.path)) {
      collectExclusiveSubtree(rejectedChild, "ONLY_IN_REJECTED", diffs);
    }
  }
}

/**
 * Consolida o resumo quantitativo e métricas a partir da lista de diferenças.
 */
function summarize(diffs: XmlComparisonDiff[]): XmlComparisonSummary {
  let onlyInApproved = 0;
  let onlyInRejected = 0;
  let valueDiffs = 0;
  let attributeDiffs = 0;
  let structureDiffs = 0;
  let contextualDiffs = 0;

  for (const diff of diffs) {
    switch (diff.kind) {
      case "ONLY_IN_APPROVED":
        onlyInApproved++;
        break;
      case "ONLY_IN_REJECTED":
        onlyInRejected++;
        break;
      case "VALUE_DIFF":
        valueDiffs++;
        break;
      case "ATTRIBUTE_DIFF":
        attributeDiffs++;
        break;
      case "STRUCTURE_DIFF":
        structureDiffs++;
        break;
      case "CONTEXTUAL_DIFF":
        contextualDiffs++;
        break;
    }
  }

  const totalDiffs =
    onlyInApproved + onlyInRejected + valueDiffs + attributeDiffs + structureDiffs;
  const identical = totalDiffs === 0 && contextualDiffs === 0;
  const hasOnlyContextualDiffs = totalDiffs === 0 && contextualDiffs > 0;

  return {
    onlyInApproved,
    onlyInRejected,
    valueDiffs,
    attributeDiffs,
    structureDiffs,
    contextualDiffs,
    totalDiffs,
    identical,
    hasOnlyContextualDiffs,
  };
}

/**
 * Compara duas árvores XML estruturais e produz o resultado completo da comparação.
 */
export function compareXmlTrees(
  approved: ComparatorXmlNode,
  rejected: ComparatorXmlNode
): XmlComparisonResult {
  const diffs: XmlComparisonDiff[] = [];

  // Se as raízes tiverem tags diferentes, registrar divergência estrutural sem continuar o percurso
  if (approved.tag !== rejected.tag) {
    diffs.push({
      id: `STRUCTURE_DIFF:${approved.path}`,
      kind: "STRUCTURE_DIFF",
      path: approved.path,
      tag: `${approved.tag} / ${rejected.tag}`,
      approvedValue: `<${approved.tag}>`,
      rejectedValue: `<${rejected.tag}>`,
      detail: `Elementos raiz incompatíveis: <${approved.tag}> no XML aprovado e <${rejected.tag}> no XML rejeitado.`,
    });

    return {
      diffs,
      summary: summarize(diffs),
    };
  }

  // Comparar raízes e suas subárvores
  compareNodes(approved, rejected, diffs);

  return {
    diffs,
    summary: summarize(diffs),
  };
}
