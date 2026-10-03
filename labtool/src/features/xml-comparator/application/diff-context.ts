/**
 * XML Comparator — Diff Context Resolver
 *
 * Responsabilidade:
 * Localiza o contexto posicional e de linhas visuais para uma divergência selecionada.
 *
 * O que faz:
 * - Encontra as linhas correspondentes nos painéis do documento aprovado e rejeitado;
 * - Resolve o caminho do nó pai (`parentPath`) para navegação hierárquica;
 * - Mapeia os índices de linha em FormattedLine[] para sincronização de scroll e destaque na UI.
 *
 * O que NÃO faz:
 * - Não armazena estado visual ou de seleção (papel do XmlComparatorView);
 * - Não recalcula diffs.
 */

import type { FormattedLine, XmlComparisonDiff } from "../domain";

/**
 * Contexto de localização de uma divergência nos documentos formatados.
 */
export interface DiffContext {
  /** A divergência analisada. */
  diff: XmlComparisonDiff;

  /** Índice da linha no painel do XML aprovado, ou null se não encontrada. */
  approvedLineIndex: number | null;

  /** Índice da linha no painel do XML rejeitado, ou null se não encontrada. */
  rejectedLineIndex: number | null;

  /** Linha formatada correspondente no XML aprovado. */
  approvedLine: FormattedLine | null;

  /** Linha formatada correspondente no XML rejeitado. */
  rejectedLine: FormattedLine | null;

  /** Caminho do nó pai imediato, ou null se for o elemento raiz. */
  parentPath: string | null;
}

/**
 * Extrai o caminho do nó pai a partir de um path posicional.
 *
 * Exemplo:
 * "/NFSe[1]/infDPS[1]/emit[1]/CNPJ[1]" -> "/NFSe[1]/infDPS[1]/emit[1]"
 * "/NFSe[1]" -> null
 */
export function getParentPath(path: string): string | null {
  if (!path || !path.startsWith("/")) {
    return null;
  }

  const segments = path.split("/").filter(Boolean);
  if (segments.length <= 1) {
    return null;
  }

  segments.pop();
  return `/${segments.join("/")}`;
}

/**
 * Encontra o índice da primeira linha formatada cujo path corresponde ao elemento procurado.
 */
export function findLineIndexByPath(
  lines: FormattedLine[],
  path: string
): number | null {
  if (!path || !lines || lines.length === 0) {
    return null;
  }

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].path === path) {
      return i;
    }
  }

  return null;
}

/**
 * Resolve o contexto completo de uma divergência em relação às linhas formatadas dos dois documentos.
 */
export function resolveDiffContext(
  diff: XmlComparisonDiff,
  approvedLines: FormattedLine[],
  rejectedLines: FormattedLine[]
): DiffContext {
  const approvedLineIndex = findLineIndexByPath(approvedLines, diff.path);
  const rejectedLineIndex = findLineIndexByPath(rejectedLines, diff.path);

  const approvedLine =
    approvedLineIndex !== null && approvedLineIndex >= 0
      ? approvedLines[approvedLineIndex]
      : null;

  const rejectedLine =
    rejectedLineIndex !== null && rejectedLineIndex >= 0
      ? rejectedLines[rejectedLineIndex]
      : null;

  const parentPath = getParentPath(diff.path);

  return {
    diff,
    approvedLineIndex,
    rejectedLineIndex,
    approvedLine,
    rejectedLine,
    parentPath,
  };
}
