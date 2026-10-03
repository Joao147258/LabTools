"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type {
  FormattedLine,
  LoadedFile,
  XmlComparisonDiff,
  XmlComparisonResult,
} from "../domain";
import {
  compareXmlTrees,
  countXmlElements,
  exportComparisonToMarkdown,
  formatXmlToLines,
  loadComparatorTree,
  resolveDiffContext,
} from "../application";
import { ComparatorUploadArea } from "./ComparatorUploadArea";
import { ComparatorSummary } from "./ComparatorSummary";
import { MirroredXmlViewer } from "./MirroredXmlViewer";
import { ComparatorDiffDetails } from "./ComparatorDiffDetails";
import { buildMirroredRows, type MirroredComparisonRow } from "./mirrored-rows";

/**
 * Visualização e orquestrador principal da feature XML Comparator.
 *
 * Responsabilidades:
 * - Gerenciamento de estado de arquivos carregados (Aprovado, Rejeitado, Erro opcional);
 * - Acionamento automático da comparação estrutural ao carregar os dois documentos obrigatórios;
 * - Construção das linhas espelhadas sincronizadas (MirroredComparisonRow[]) via buildMirroredRows;
 * - Indexação em memória das divergências por path estrutural canônico;
 * - Seleção e navegação determinística de divergências estruturais;
 * - Resolução de contexto para o painel de detalhes (linhas, nós pais, valores comparados);
 * - Orquestração segura da exportação Markdown (higienização na application -> download local).
 */
export function XmlComparatorView() {
  // Estado dos arquivos originais preservados
  const [approvedFile, setApprovedFile] = useState<LoadedFile | null>(null);
  const [rejectedFile, setRejectedFile] = useState<LoadedFile | null>(null);
  const [errorFile, setErrorFile] = useState<LoadedFile | null>(null);

  // Estado das linhas formatadas
  const [approvedLines, setApprovedLines] = useState<FormattedLine[]>([]);
  const [rejectedLines, setRejectedLines] = useState<FormattedLine[]>([]);

  // Resultado da comparação estrutural
  const [comparisonResult, setComparisonResult] = useState<XmlComparisonResult | null>(null);

  // Seleção de divergência e de linha espelhada
  const [selectedDiffId, setSelectedDiffId] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Estados de processamento e feedback visual
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Índice O(1) de divergências por path estrutural posicional
  const diffsByPath = useMemo(() => {
    const map = new Map<string, XmlComparisonDiff[]>();
    if (!comparisonResult?.diffs) return map;

    for (const diff of comparisonResult.diffs) {
      const existing = map.get(diff.path) ?? [];
      existing.push(diff);
      map.set(diff.path, existing);
    }

    return map;
  }, [comparisonResult]);

  // Linhas espelhadas alinhadas por identidade estrutural
  const mirroredRows = useMemo(() => {
    return buildMirroredRows(approvedLines, rejectedLines, diffsByPath);
  }, [approvedLines, rejectedLines, diffsByPath]);

  // Divergência selecionada derivada
  const selectedDiff = useMemo(() => {
    if (!selectedDiffId || !comparisonResult?.diffs) return null;
    return comparisonResult.diffs.find((d) => d.id === selectedDiffId) ?? null;
  }, [selectedDiffId, comparisonResult]);

  // Contexto de localização da divergência derivada
  const diffContext = useMemo(() => {
    if (!selectedDiff) return null;
    return resolveDiffContext(selectedDiff, approvedLines, rejectedLines);
  }, [selectedDiff, approvedLines, rejectedLines]);

  // Índice atual da divergência na lista ordenada
  const currentDiffIndex = useMemo(() => {
    if (!selectedDiffId || !comparisonResult?.diffs) return -1;
    return comparisonResult.diffs.findIndex((d) => d.id === selectedDiffId);
  }, [selectedDiffId, comparisonResult]);

  // Contagem estrutural de elementos XML (Node.ELEMENT_NODE)
  const approvedElementCount = useMemo(() => {
    if (!approvedFile?.text) return 0;
    return countXmlElements(approvedFile.text);
  }, [approvedFile]);

  const rejectedElementCount = useMemo(() => {
    if (!rejectedFile?.text) return 0;
    return countXmlElements(rejectedFile.text);
  }, [rejectedFile]);

  /**
   * Executa a comparação entre os dois documentos XML utilizando a camada de application.
   */
  const executeComparison = useCallback(
    (appFile: LoadedFile, rejFile: LoadedFile) => {
      setIsProcessing(true);
      setErrorMessage(null);
      setExportSuccessMessage(null);

      try {
        // 1. Formatar linhas para exibição sincronizada
        let appLines: FormattedLine[] = [];
        try {
          appLines = formatXmlToLines(appFile.text);
          setApprovedLines(appLines);
        } catch (err) {
          throw new Error(
            `Não foi possível interpretar o XML aprovado (${appFile.name}): ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }

        let rejLines: FormattedLine[] = [];
        try {
          rejLines = formatXmlToLines(rejFile.text);
          setRejectedLines(rejLines);
        } catch (err) {
          throw new Error(
            `Não foi possível interpretar o XML rejeitado (${rejFile.name}): ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }

        // 2. Construir árvores hierárquicas normalizadas
        const appTree = loadComparatorTree(appFile.text);
        const rejTree = loadComparatorTree(rejFile.text);

        // 3. Executar o diff estrutural
        const result = compareXmlTrees(appTree, rejTree);
        setComparisonResult(result);

        // 4. Auto-selecionar a primeira divergência (se houver)
        if (result.diffs.length > 0) {
          setSelectedDiffId(result.diffs[0].id);
        } else {
          setSelectedDiffId(null);
          setSelectedRowId(null);
        }
      } catch (err) {
        setComparisonResult(null);
        setSelectedDiffId(null);
        setSelectedRowId(null);
        setErrorMessage(
          err instanceof Error ? err.message : "Erro inesperado ao comparar os documentos."
        );
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  /**
   * Carregamento do XML Aprovado
   */
  const handleApprovedLoaded = useCallback(
    (file: LoadedFile) => {
      setApprovedFile(file);
      setSelectedDiffId(null);
      setSelectedRowId(null);
      setErrorMessage(null);
      setExportSuccessMessage(null);

      if (rejectedFile) {
        executeComparison(file, rejectedFile);
      } else {
        try {
          const lines = formatXmlToLines(file.text);
          setApprovedLines(lines);
        } catch (err) {
          setErrorMessage(
            `Não foi possível interpretar o XML aprovado: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
          setApprovedLines([]);
        }
      }
    },
    [rejectedFile, executeComparison]
  );

  /**
   * Carregamento do XML Rejeitado
   */
  const handleRejectedLoaded = useCallback(
    (file: LoadedFile) => {
      setRejectedFile(file);
      setSelectedDiffId(null);
      setSelectedRowId(null);
      setErrorMessage(null);
      setExportSuccessMessage(null);

      if (approvedFile) {
        executeComparison(approvedFile, file);
      } else {
        try {
          const lines = formatXmlToLines(file.text);
          setRejectedLines(lines);
        } catch (err) {
          setErrorMessage(
            `Não foi possível interpretar o XML rejeitado: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
          setRejectedLines([]);
        }
      }
    },
    [approvedFile, executeComparison]
  );

  /**
   * Carregamento do arquivo complementar de erro
   */
  const handleErrorFileLoaded = useCallback((file: LoadedFile) => {
    setErrorFile(file);
    setExportSuccessMessage(null);
  }, []);

  /**
   * Remoção do XML Aprovado
   */
  const handleApprovedRemoved = useCallback(() => {
    setApprovedFile(null);
    setApprovedLines([]);
    setComparisonResult(null);
    setSelectedDiffId(null);
    setSelectedRowId(null);
    setExportSuccessMessage(null);
  }, []);

  /**
   * Remoção do XML Rejeitado
   */
  const handleRejectedRemoved = useCallback(() => {
    setRejectedFile(null);
    setRejectedLines([]);
    setComparisonResult(null);
    setSelectedDiffId(null);
    setSelectedRowId(null);
    setExportSuccessMessage(null);
  }, []);

  /**
   * Remoção do Arquivo de Erro
   */
  const handleErrorFileRemoved = useCallback(() => {
    setErrorFile(null);
    setExportSuccessMessage(null);
  }, []);

  /**
   * Limpar todos os arquivos e estados
   */
  const handleResetAll = useCallback(() => {
    setApprovedFile(null);
    setRejectedFile(null);
    setErrorFile(null);
    setApprovedLines([]);
    setRejectedLines([]);
    setComparisonResult(null);
    setSelectedDiffId(null);
    setSelectedRowId(null);
    setErrorMessage(null);
    setExportSuccessMessage(null);
  }, []);

  /**
   * Seleção de linha espelhada completa (ao clicar em qualquer célula ou slot)
   * Possui comportamento de toggle: ao clicar na linha já selecionada, ela é desmarcada.
   */
  const handleSelectRow = useCallback((row: MirroredComparisonRow) => {
    setSelectedRowId((prev) => {
      if (prev === row.id) {
        setSelectedDiffId(null);
        return null;
      }
      if (row.diffs.length > 0) {
        setSelectedDiffId(row.diffs[0].id);
      } else {
        setSelectedDiffId(null);
      }
      return row.id;
    });
  }, []);

  /**
   * Seleção de divergência por ID (botões, chips, resumo)
   * Possui comportamento de toggle: ao clicar no chip já selecionado, ele é desmarcado.
   */
  const handleSelectDiffById = useCallback(
    (diffId: string) => {
      setSelectedDiffId((prev) => {
        if (prev === diffId) {
          setSelectedRowId(null);
          return null;
        }
        const matchingRow = mirroredRows.find((r) => r.diffs.some((d) => d.id === diffId));
        if (matchingRow) {
          setSelectedRowId(matchingRow.id);
        }
        return diffId;
      });
    },
    [mirroredRows]
  );

  /**
   * Navegação anterior / próxima entre divergências
   */
  const handleNavigateDiff = useCallback(
    (direction: "prev" | "next") => {
      if (!comparisonResult?.diffs || comparisonResult.diffs.length === 0) return;

      const total = comparisonResult.diffs.length;
      let nextIndex = currentDiffIndex;

      if (direction === "prev") {
        nextIndex = currentDiffIndex > 0 ? currentDiffIndex - 1 : 0;
      } else if (direction === "next") {
        nextIndex = currentDiffIndex < total - 1 ? currentDiffIndex + 1 : total - 1;
      }

      const nextDiff = comparisonResult.diffs[nextIndex];
      if (nextDiff) {
        setSelectedDiffId(nextDiff.id);
        const matchingRow = mirroredRows.find((r) => r.diffs.some((d) => d.id === nextDiff.id));
        if (matchingRow) {
          setSelectedRowId(matchingRow.id);
        }
      }
    },
    [comparisonResult, currentDiffIndex, mirroredRows]
  );

  /**
   * Exportação do Relatório Markdown Sanitizado
   */
  const handleExportMarkdown = useCallback(() => {
    if (!approvedFile || !rejectedFile) {
      setErrorMessage("É necessário carregar os dois documentos XML para exportar o relatório.");
      return;
    }

    setErrorMessage(null);
    setExportSuccessMessage(null);

    const exportResult = exportComparisonToMarkdown({
      approved: approvedFile,
      rejected: rejectedFile,
      errorFile,
    });

    if (exportResult.success && exportResult.markdown) {
      try {
        const blob = new Blob([exportResult.markdown], {
          type: "text/markdown;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = exportResult.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setExportSuccessMessage(
          `Relatório "${exportResult.filename}" gerado e baixado com sucesso!`
        );
      } catch {
        setErrorMessage("Erro ao iniciar download do relatório no navegador.");
      }
    } else {
      setErrorMessage(
        exportResult.errorMessage || "Falha na higienização e geração do relatório."
      );
    }
  }, [approvedFile, rejectedFile, errorFile]);

  const hasAnyFile = Boolean(approvedFile || rejectedFile || errorFile);

  return (
    <div
      data-testid="xml-comparator-view"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "var(--color-base)",
        color: "var(--color-text)",
        padding: "var(--space-xl)",
        gap: "var(--space-md)",
        maxWidth: "1600px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Cabeçalho da Ferramenta */}
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-xs)",
          borderBottom: "1px solid var(--color-surface0)",
          paddingBottom: "var(--space-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2xs)",
              fontSize: "var(--font-size-ui-sm)",
              color: "var(--color-subtext0)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            &larr; LabTools
          </Link>

          {hasAnyFile && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              {comparisonResult && (
                <button
                  type="button"
                  data-testid="header-export-button"
                  onClick={handleExportMarkdown}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--space-xs)",
                    padding: "var(--space-xs) var(--space-md)",
                    fontSize: "var(--font-size-ui-sm)",
                    fontWeight: 600,
                    color: "var(--color-crust)",
                    backgroundColor: "var(--color-blue)",
                    border: "none",
                    borderRadius: "var(--radius-xs)",
                    cursor: "pointer",
                  }}
                >
                  &#8681; Exportar Relatório (.md)
                </button>
              )}

              <button
                type="button"
                data-testid="reset-all-button"
                onClick={handleResetAll}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-xs)",
                  padding: "var(--space-xs) var(--space-sm)",
                  fontSize: "var(--font-size-ui-xs)",
                  color: "var(--color-text)",
                  backgroundColor: "var(--color-surface0)",
                  border: "1px solid var(--color-surface1)",
                  borderRadius: "var(--radius-xs)",
                  cursor: "pointer",
                }}
              >
                Limpar Tudo
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--space-sm)",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "var(--font-size-ui-xl)",
                fontWeight: 700,
                color: "var(--color-text)",
                lineHeight: "var(--line-height-ui-xl)",
              }}
            >
              XML Comparator
            </h1>
            <p
              style={{
                fontSize: "var(--font-size-ui-sm)",
                color: "var(--color-subtext0)",
              }}
            >
              Comparação estrutural profunda e visualização side-by-side entre documentos XML fiscais.
            </p>
          </div>
        </div>
      </header>

      {/* Banner de Erro */}
      {errorMessage && (
        <div
          role="alert"
          data-testid="comparator-error-banner"
          style={{
            padding: "var(--space-sm) var(--space-md)",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "rgba(243, 139, 168, 0.15)",
            border: "1px solid var(--color-red)",
            color: "var(--color-red)",
            fontSize: "var(--font-size-ui-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            <strong>Erro:</strong> {errorMessage}
          </span>
          <button
            type="button"
            data-testid="close-error-banner"
            onClick={() => setErrorMessage(null)}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-red)",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "16px",
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Banner de Sucesso na Exportação */}
      {exportSuccessMessage && (
        <div
          data-testid="comparator-export-success-banner"
          style={{
            padding: "var(--space-sm) var(--space-md)",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "rgba(166, 227, 161, 0.15)",
            border: "1px solid var(--color-green)",
            color: "var(--color-green)",
            fontSize: "var(--font-size-ui-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            <strong>Sucesso:</strong> {exportSuccessMessage}
          </span>
          <button
            type="button"
            data-testid="close-success-banner"
            onClick={() => setExportSuccessMessage(null)}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-green)",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "16px",
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Seção 1: Área de Uploads */}
      <ComparatorUploadArea
        approvedFile={approvedFile}
        rejectedFile={rejectedFile}
        errorFile={errorFile}
        onApprovedLoaded={handleApprovedLoaded}
        onRejectedLoaded={handleRejectedLoaded}
        onErrorFileLoaded={handleErrorFileLoaded}
        onApprovedRemoved={handleApprovedRemoved}
        onRejectedRemoved={handleRejectedRemoved}
        onErrorFileRemoved={handleErrorFileRemoved}
        onError={setErrorMessage}
        isProcessing={isProcessing}
      />

      {/* Seção 2: Resumo e Métricas (se houver comparação) */}
      {comparisonResult && (
        <ComparatorSummary
          summary={comparisonResult.summary}
          diffs={comparisonResult.diffs}
          selectedDiffId={selectedDiffId}
          onSelectDiff={handleSelectDiffById}
          onNavigate={handleNavigateDiff}
        />
      )}

      {/* Seção 3: Visualizador de XML Espelhado Side-by-Side com Linhas Alinhadas */}
      {(approvedFile || rejectedFile) && (
        <MirroredXmlViewer
          rows={mirroredRows}
          selectedRowId={selectedRowId}
          selectedDiffId={selectedDiffId}
          onSelectRow={handleSelectRow}
          approvedFile={approvedFile}
          rejectedFile={rejectedFile}
          approvedLinesCount={approvedLines.length}
          rejectedLinesCount={rejectedLines.length}
          approvedElementCount={approvedElementCount}
          rejectedElementCount={rejectedElementCount}
          emptyMessage="Carregue os arquivos XML para visualizar a comparação espelhada."
        />
      )}

      {/* Seção 4: Detalhes da Divergência Selecionada (se houver comparação e divergências) */}
      {comparisonResult && !comparisonResult.summary.identical && (
        <ComparatorDiffDetails
          diff={selectedDiff}
          diffContext={diffContext}
          currentIndex={currentDiffIndex}
          totalCount={comparisonResult.diffs.length}
          onNavigate={handleNavigateDiff}
        />
      )}
    </div>
  );
}
