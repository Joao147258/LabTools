/**
 * XML Comparator — Mirrored Rows Alignment Helper
 *
 * Responsabilidade:
 * Alinha estruturalmente as linhas formatadas do XML Aprovado e do XML Rejeitado
 * para exibição espelhada side-by-side (Mirrored Comparison View).
 *
 * Invariantes:
 * - O alinhamento utiliza primariamente a identidade estrutural canônica (FormattedLine.path);
 * - Linhas sem path (como a declaração <?xml...?>) são alinhadas na primeira posição;
 * - Elementos presentes exclusivamente em um lado geram slot vazio (null) no lado oposto;
 * - Elementos inseridos ou removidos não deslocam o alinhamento das linhas subsequentes;
 * - Múltiplas divergências no mesmo path são preservadas no array diffs de cada row;
 * - Algoritmo determinístico baseado em Longest Common Subsequence (LCS) sobre as chaves estruturais.
 */

import type { FormattedLine, XmlComparisonDiff } from "../domain";

/**
 * Representa uma linha lógica da comparação espelhada.
 * Contém a linha formatada do lado aprovado, do lado rejeitado e os diffs associados.
 */
export interface MirroredComparisonRow {
  /** Identificador determinístico e único da linha espelhada. */
  id: string;

  /** Caminho estrutural posicional canônico associado à linha, ou null se declaração. */
  path: string | null;

  /** Linha formatada no documento aprovado, ou null se ausente (slot vazio). */
  approved: FormattedLine | null;

  /** Linha formatada no documento rejeitado, ou null se ausente (slot vazio). */
  rejected: FormattedLine | null;

  /** Número da linha lógica 1-based no XML aprovado, ou null se slot vazio. */
  approvedLineNumber: number | null;

  /** Número da linha lógica 1-based no XML rejeitado, ou null se slot vazio. */
  rejectedLineNumber: number | null;

  /** Lista de divergências estruturais ou de valor vinculadas a esta linha. */
  diffs: XmlComparisonDiff[];
}

/**
 * Produz uma chave canônica de alinhamento estrutural para uma linha formatada.
 * Distingue abertura de container, fechamento de container, elementos folha e declaração XML.
 */
export function getLineAlignmentKey(line: FormattedLine): string {
  const trimmed = line.text.trim();

  // Linhas sem path (declaração XML ou comentários no topo)
  if (!line.path) {
    if (trimmed.startsWith("<?xml")) {
      return "__XML_DECLARATION__";
    }
    return `__NO_PATH__:${trimmed}`;
  }

  // Linha de fechamento de tag (ex: </emit>, </infNFe>)
  if (trimmed.startsWith("</")) {
    return `${line.path}#close`;
  }

  // Linha de elemento folha (ex: <cProd>PROD001</cProd> ou <vProd/>)
  if (trimmed.endsWith("/>") || trimmed.includes("</")) {
    return `${line.path}#leaf`;
  }

  // Linha de abertura de tag container (ex: <emit>, <infNFe ...>)
  return `${line.path}#open`;
}

/**
 * Constrói a lista de linhas espelhadas alinhadas (MirroredComparisonRow[])
 * a partir das linhas formatadas dos dois documentos e do índice de diffs por path.
 */
export function buildMirroredRows(
  approvedLines: FormattedLine[],
  rejectedLines: FormattedLine[],
  diffsByPath: Map<string, XmlComparisonDiff[]>
): MirroredComparisonRow[] {
  const n = approvedLines.length;
  const m = rejectedLines.length;

  // Caso 1: Ambos vazios
  if (n === 0 && m === 0) {
    return [];
  }

  // Caso 2: Apenas XML aprovado carregado
  if (n > 0 && m === 0) {
    return approvedLines.map((line, idx) => {
      const path = line.path;
      const diffs = path ? diffsByPath.get(path) ?? [] : [];
      return {
        id: `row-app-${idx + 1}`,
        path,
        approved: line,
        rejected: null,
        approvedLineNumber: idx + 1,
        rejectedLineNumber: null,
        diffs,
      };
    });
  }

  // Caso 3: Apenas XML rejeitado carregado
  if (n === 0 && m > 0) {
    return rejectedLines.map((line, idx) => {
      const path = line.path;
      const diffs = path ? diffsByPath.get(path) ?? [] : [];
      return {
        id: `row-rej-${idx + 1}`,
        path,
        approved: null,
        rejected: line,
        approvedLineNumber: null,
        rejectedLineNumber: idx + 1,
        diffs,
      };
    });
  }

  // Caso 4: Ambos os documentos presentes -> Algoritmo LCS para alinhamento estrutural ótimo
  const keysA = approvedLines.map(getLineAlignmentKey);
  const keysB = rejectedLines.map(getLineAlignmentKey);

  const stride = m + 1;
  const dp = new Int32Array((n + 1) * stride);

  for (let i = 1; i <= n; i++) {
    const rowOffset = i * stride;
    const prevRowOffset = (i - 1) * stride;
    const keyA = keysA[i - 1];

    for (let j = 1; j <= m; j++) {
      if (keyA === keysB[j - 1]) {
        dp[rowOffset + j] = dp[prevRowOffset + (j - 1)] + 1;
      } else {
        const top = dp[prevRowOffset + j];
        const left = dp[rowOffset + (j - 1)];
        dp[rowOffset + j] = top >= left ? top : left;
      }
    }
  }

  // Backtracking da matriz DP para reconstruir as rows alinhadas
  let i = n;
  let j = m;
  const rows: MirroredComparisonRow[] = [];

  while (i > 0 || j > 0) {
    const rowOffset = i * stride;
    const prevRowOffset = (i - 1) * stride;

    if (i > 0 && j > 0 && keysA[i - 1] === keysB[j - 1]) {
      // Linhas correspondentes em ambos os lados
      const appLine = approvedLines[i - 1];
      const rejLine = rejectedLines[j - 1];
      const path = appLine.path ?? rejLine.path;
      const diffs = path ? diffsByPath.get(path) ?? [] : [];

      rows.push({
        id: `row-${i}-${j}`,
        path,
        approved: appLine,
        rejected: rejLine,
        approvedLineNumber: i,
        rejectedLineNumber: j,
        diffs,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[rowOffset + (j - 1)] >= dp[prevRowOffset + j])) {
      // Elemento presente apenas no XML rejeitado (inserção / ONLY_IN_REJECTED)
      const rejLine = rejectedLines[j - 1];
      const path = rejLine.path;
      const diffs = path ? diffsByPath.get(path) ?? [] : [];

      rows.push({
        id: `row-slot-app-${j}`,
        path,
        approved: null,
        rejected: rejLine,
        approvedLineNumber: null,
        rejectedLineNumber: j,
        diffs,
      });
      j--;
    } else if (i > 0) {
      // Elemento presente apenas no XML aprovado (remoção / ONLY_IN_APPROVED)
      const appLine = approvedLines[i - 1];
      const path = appLine.path;
      const diffs = path ? diffsByPath.get(path) ?? [] : [];

      rows.push({
        id: `row-slot-rej-${i}`,
        path,
        approved: appLine,
        rejected: null,
        approvedLineNumber: i,
        rejectedLineNumber: null,
        diffs,
      });
      i--;
    }
  }

  rows.reverse();
  return rows;
}
