"use client";

import React, { useEffect, useRef } from "react";
import type { LoadedFile } from "../domain";
import { formatBytes } from "./ComparatorUploadArea";
import type { MirroredComparisonRow } from "./mirrored-rows";
import { MirroredXmlRow } from "./MirroredXmlRow";

export interface MirroredXmlViewerProps {
  rows: MirroredComparisonRow[];
  selectedRowId: string | null;
  selectedDiffId: string | null;
  onSelectRow: (row: MirroredComparisonRow) => void;
  approvedFile: LoadedFile | null;
  rejectedFile: LoadedFile | null;
  approvedLinesCount: number;
  rejectedLinesCount: number;
  approvedElementCount?: number;
  rejectedElementCount?: number;
  emptyMessage?: string;
  isFullscreen?: boolean;
}

/**
 * Visualizador espelhado principal do XML Comparator.
 *
 * Responsabilidades:
 * - Renderiza cabeçalhos independentes para XML Aprovado e XML Rejeitado (nome, tamanho, elementos e linhas);
 * - Hospeda um container com scroll vertical único e compartilhado para eliminação absoluta de desvio posicional;
 * - Renderiza cada linha espelhada como uma única row CSS Grid compartilhada;
 * - Executa scroll suave e determinístico até a linha ou divergência selecionada.
 */
export function MirroredXmlViewer({
  rows,
  selectedRowId,
  selectedDiffId,
  onSelectRow,
  approvedFile,
  rejectedFile,
  approvedLinesCount,
  rejectedLinesCount,
  approvedElementCount,
  rejectedElementCount,
  emptyMessage = "Carregue os arquivos XML para visualizar a comparação espelhada.",
  isFullscreen = false,
}: MirroredXmlViewerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const registerRowRef = (rowId: string, el: HTMLDivElement | null) => {
    if (el) {
      rowRefs.current.set(rowId, el);
    } else {
      rowRefs.current.delete(rowId);
    }
  };

  // Scroll suave até a linha/divergência selecionada
  useEffect(() => {
    if (!selectedRowId && !selectedDiffId) return;

    let targetRowId = selectedRowId;
    if (!targetRowId && selectedDiffId) {
      const matchingRow = rows.find((r) => r.diffs.some((d) => d.id === selectedDiffId));
      if (matchingRow) {
        targetRowId = matchingRow.id;
      }
    }

    if (targetRowId) {
      const rowEl = rowRefs.current.get(targetRowId);
      if (rowEl && scrollContainerRef.current && typeof rowEl.scrollIntoView === "function") {
        try {
          const prefersReducedMotion =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          rowEl.scrollIntoView({
            block: "center",
            behavior: prefersReducedMotion ? "auto" : "smooth",
          });
        } catch {
          // Fallback para ambientes sem suporte a smooth scroll (ex: jsdom)
          rowEl.scrollIntoView();
        }
      }
    }
  }, [selectedRowId, selectedDiffId, rows]);

  return (
    <main
      data-testid="comparator-panels-container"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        backgroundColor: "var(--color-base)",
        border: "1px solid var(--color-surface1)",
        borderRadius: "var(--radius-md)",
        flex: isFullscreen ? "1 1 auto" : undefined,
        minHeight: isFullscreen ? 0 : undefined,
      }}
    >
      {/* Cabeçalho Dividido: Aprovado à Esquerda | Rejeitado à Direita (Sticky nível 2) */}
      <div
        data-testid="comparator-panels-header"
        style={{
          position: "sticky",
          top: "var(--comparator-summary-height, 0px)",
          zIndex: 15,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          backgroundColor: "var(--color-mantle)",
          borderBottom: "1px solid var(--color-surface0)",
          borderTopLeftRadius: "var(--radius-md)",
          borderTopRightRadius: "var(--radius-md)",
        }}
      >
        {/* Cabeçalho Aprovado */}
        <div
          data-testid="comparator-approved-panel"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--space-sm) var(--space-md)",
            borderRight: "1px solid var(--color-surface0)",
            gap: "var(--space-sm)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <span
              style={{
                fontSize: "var(--font-size-ui-xs)",
                fontWeight: 700,
                color: "var(--color-green)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              XML Aprovado (Esperado)
            </span>
            {approvedFile && (
              <span
                style={{
                  fontFamily: "var(--font-family-code)",
                  fontSize: "var(--font-size-code-sm)",
                  color: "var(--color-subtext1)",
                  backgroundColor: "var(--color-surface0)",
                  padding: "2px 6px",
                  borderRadius: "var(--radius-xs)",
                  maxWidth: "200px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={approvedFile.name}
              >
                {approvedFile.name} ({formatBytes(approvedFile.size)})
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
            {approvedElementCount !== undefined && approvedElementCount > 0 && (
              <span
                data-testid="approved-element-count"
                style={{
                  fontSize: "var(--font-size-ui-2xs)",
                  fontFamily: "var(--font-family-code)",
                  color: "var(--color-text)",
                  backgroundColor: "var(--color-surface0)",
                  border: "1px solid var(--color-surface1)",
                  padding: "2px 6px",
                  borderRadius: "var(--radius-xs)",
                  fontWeight: 600,
                }}
              >
                {approvedElementCount} {approvedElementCount === 1 ? "elemento" : "elementos"}
              </span>
            )}
            {approvedLinesCount > 0 && (
              <span
                data-testid="approved-line-count"
                style={{
                  fontSize: "var(--font-size-ui-2xs)",
                  fontFamily: "var(--font-family-code)",
                  color: "var(--color-subtext0)",
                }}
              >
                ({approvedLinesCount} linhas)
              </span>
            )}
          </div>
        </div>

        {/* Cabeçalho Rejeitado */}
        <div
          data-testid="comparator-rejected-panel"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--space-sm) var(--space-md)",
            gap: "var(--space-sm)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <span
              style={{
                fontSize: "var(--font-size-ui-xs)",
                fontWeight: 700,
                color: "var(--color-red)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              XML Rejeitado / Modificado
            </span>
            {rejectedFile && (
              <span
                style={{
                  fontFamily: "var(--font-family-code)",
                  fontSize: "var(--font-size-code-sm)",
                  color: "var(--color-subtext1)",
                  backgroundColor: "var(--color-surface0)",
                  padding: "2px 6px",
                  borderRadius: "var(--radius-xs)",
                  maxWidth: "200px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={rejectedFile.name}
              >
                {rejectedFile.name} ({formatBytes(rejectedFile.size)})
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
            {rejectedElementCount !== undefined && rejectedElementCount > 0 && (
              <span
                data-testid="rejected-element-count"
                style={{
                  fontSize: "var(--font-size-ui-2xs)",
                  fontFamily: "var(--font-family-code)",
                  color: "var(--color-text)",
                  backgroundColor: "var(--color-surface0)",
                  border: "1px solid var(--color-surface1)",
                  padding: "2px 6px",
                  borderRadius: "var(--radius-xs)",
                  fontWeight: 600,
                }}
              >
                {rejectedElementCount} {rejectedElementCount === 1 ? "elemento" : "elementos"}
              </span>
            )}
            {rejectedLinesCount > 0 && (
              <span
                data-testid="rejected-line-count"
                style={{
                  fontSize: "var(--font-size-ui-2xs)",
                  fontFamily: "var(--font-family-code)",
                  color: "var(--color-subtext0)",
                }}
              >
                ({rejectedLinesCount} linhas)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Corpo Espelhado com Scroll Vertical Único */}
      <div
        ref={scrollContainerRef}
        data-testid="mirrored-scroll-container"
        style={{
          flex: "1 1 auto",
          overflowY: "auto",
          overflowX: "hidden",
          maxHeight: isFullscreen ? "none" : "560px",
          minHeight: isFullscreen ? "300px" : "280px",
          height: isFullscreen ? "100%" : undefined,
          backgroundColor: "var(--color-crust)",
          fontFamily: "var(--font-family-code)",
          fontSize: "var(--font-size-code-sm)",
          lineHeight: "var(--line-height-code-sm)",
        }}
      >
        {rows.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "280px",
              color: "var(--color-overlay0)",
              fontSize: "var(--font-size-ui-sm)",
              padding: "var(--space-lg)",
              textAlign: "center",
            }}
          >
            {emptyMessage}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", width: "100%", padding: "var(--space-2xs) 0" }}>
            {rows.map((row) => {
              const isSelected =
                row.id === selectedRowId ||
                (selectedDiffId !== null && row.diffs.some((d) => d.id === selectedDiffId));

              return (
                <MirroredXmlRow
                  key={row.id}
                  row={row}
                  isSelected={isSelected}
                  selectedDiffId={selectedDiffId}
                  onSelectRow={onSelectRow}
                  registerRowRef={registerRowRef}
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
