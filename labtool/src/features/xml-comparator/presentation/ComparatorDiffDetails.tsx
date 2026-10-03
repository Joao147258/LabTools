"use client";

import React from "react";
import type { XmlComparisonDiff } from "../domain";
import type { DiffContext } from "../application";

export interface ComparatorDiffDetailsProps {
  diff: XmlComparisonDiff | null;
  diffContext: DiffContext | null;
  currentIndex: number;
  totalCount: number;
  onNavigate: (direction: "prev" | "next") => void;
  onClose?: () => void;
}

function getDiffKindMeta(kind: XmlComparisonDiff["kind"]): {
  label: string;
  color: string;
  bg: string;
} {
  switch (kind) {
    case "ONLY_IN_APPROVED":
      return {
        label: "Presente apenas no Aprovado",
        color: "var(--color-green)",
        bg: "rgba(166, 227, 161, 0.15)",
      };
    case "ONLY_IN_REJECTED":
      return {
        label: "Presente apenas no Rejeitado",
        color: "var(--color-red)",
        bg: "rgba(243, 139, 168, 0.15)",
      };
    case "VALUE_DIFF":
      return {
        label: "Divergência de Valor",
        color: "var(--color-yellow)",
        bg: "rgba(249, 226, 175, 0.15)",
      };
    case "ATTRIBUTE_DIFF":
      return {
        label: "Divergência de Atributos",
        color: "var(--color-peach)",
        bg: "rgba(250, 179, 135, 0.15)",
      };
    case "STRUCTURE_DIFF":
      return {
        label: "Divergência Estrutural",
        color: "var(--color-sapphire)",
        bg: "rgba(116, 199, 236, 0.15)",
      };
    case "CONTEXTUAL_DIFF":
      return {
        label: "Divergência Contextual",
        color: "var(--color-sky)",
        bg: "rgba(137, 220, 235, 0.15)",
      };
    default:
      return {
        label: "Divergência",
        color: "var(--color-blue)",
        bg: "rgba(137, 180, 250, 0.15)",
      };
  }
}

/**
 * Painel de inspeção detalhada da divergência selecionada no comparador.
 */
export function ComparatorDiffDetails({
  diff,
  diffContext,
  currentIndex,
  totalCount,
  onNavigate,
  onClose,
}: ComparatorDiffDetailsProps) {
  if (!diff) {
    return (
      <footer
        data-testid="comparator-diff-details-empty"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--space-md)",
          backgroundColor: "var(--color-mantle)",
          border: "1px solid var(--color-surface0)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-subtext0)",
          fontSize: "var(--font-size-ui-sm)",
        }}
      >
        <span>Selecione uma divergência para inspecionar os detalhes estruturais e valores.</span>
      </footer>
    );
  }

  const kindMeta = getDiffKindMeta(diff.kind);

  return (
    <footer
      data-testid="comparator-diff-details"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
        padding: "var(--space-md)",
        backgroundColor: "var(--color-mantle)",
        border: "1px solid var(--color-surface1)",
        borderRadius: "var(--radius-md)",
        color: "var(--color-text)",
      }}
    >
      {/* Top Header: Tipo, Tag, Navegação */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-sm)",
          borderBottom: "1px solid var(--color-surface0)",
          paddingBottom: "var(--space-xs)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flexWrap: "wrap" }}>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "var(--radius-xs)",
              backgroundColor: kindMeta.bg,
              color: kindMeta.color,
              fontSize: "var(--font-size-ui-xs)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {kindMeta.label}
          </span>

          <span
            style={{
              fontFamily: "var(--font-family-code)",
              fontSize: "var(--font-size-code-md)",
              fontWeight: 700,
              color: "var(--color-text)",
            }}
          >
            &lt;{diff.tag}&gt;
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <span
            style={{
              fontSize: "var(--font-size-code-sm)",
              fontFamily: "var(--font-family-code)",
              color: "var(--color-subtext1)",
            }}
          >
            {currentIndex + 1} de {totalCount}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2xs)" }}>
            <button
              type="button"
              data-testid="diff-details-prev-button"
              onClick={() => onNavigate("prev")}
              disabled={currentIndex <= 0}
              aria-label="Divergência anterior"
              style={{
                padding: "var(--space-2xs) var(--space-xs)",
                fontSize: "var(--font-size-ui-xs)",
                backgroundColor: "var(--color-surface0)",
                border: "1px solid var(--color-surface1)",
                borderRadius: "var(--radius-xs)",
                color: currentIndex <= 0 ? "var(--color-overlay0)" : "var(--color-text)",
                cursor: currentIndex <= 0 ? "not-allowed" : "pointer",
              }}
            >
              &larr; Anterior
            </button>
            <button
              type="button"
              data-testid="diff-details-next-button"
              onClick={() => onNavigate("next")}
              disabled={currentIndex >= totalCount - 1}
              aria-label="Próxima divergência"
              style={{
                padding: "var(--space-2xs) var(--space-xs)",
                fontSize: "var(--font-size-ui-xs)",
                backgroundColor: "var(--color-surface0)",
                border: "1px solid var(--color-surface1)",
                borderRadius: "var(--radius-xs)",
                color: currentIndex >= totalCount - 1 ? "var(--color-overlay0)" : "var(--color-text)",
                cursor: currentIndex >= totalCount - 1 ? "not-allowed" : "pointer",
              }}
            >
              Próxima &rarr;
            </button>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar detalhes"
              style={{
                background: "none",
                border: "none",
                color: "var(--color-subtext0)",
                fontSize: "16px",
                cursor: "pointer",
                padding: "0 var(--space-xs)",
              }}
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Path e Descrição */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2xs)",
          fontSize: "var(--font-size-ui-xs)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-xs)", flexWrap: "wrap" }}>
          <strong style={{ color: "var(--color-subtext1)" }}>Caminho Canônico:</strong>
          <code
            data-testid="diff-details-path"
            style={{
              fontFamily: "var(--font-family-code)",
              color: "var(--color-blue)",
              backgroundColor: "var(--color-surface0)",
              padding: "1px 6px",
              borderRadius: "var(--radius-xs)",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {diff.path}
          </code>
        </div>

        {diffContext?.parentPath && (
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-xs)", flexWrap: "wrap" }}>
            <span style={{ color: "var(--color-subtext0)" }}>Nó Pai:</span>
            <code
              data-testid="diff-details-parent-path"
              style={{
                fontFamily: "var(--font-family-code)",
                color: "var(--color-subtext1)",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {diffContext.parentPath}
            </code>
          </div>
        )}

        <div style={{ color: "var(--color-text)", paddingTop: "2px" }}>
          <span style={{ color: "var(--color-subtext1)" }}>Descrição: </span>
          <span data-testid="diff-details-text">{diff.detail}</span>
        </div>
      </div>

      {/* Valores Comparados: Aprovado vs Rejeitado */}
      {(diff.approvedValue !== null || diff.rejectedValue !== null) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "var(--space-sm)",
            marginTop: "var(--space-xs)",
          }}
        >
          {/* Caixa Aprovado */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2xs)",
              padding: "var(--space-sm)",
              backgroundColor: "rgba(166, 227, 161, 0.06)",
              border: "1px solid rgba(166, 227, 161, 0.3)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <span
              style={{
                fontSize: "var(--font-size-ui-2xs)",
                fontWeight: 700,
                color: "var(--color-green)",
                textTransform: "uppercase",
              }}
            >
              Valor no XML Aprovado
            </span>
            <div
              data-testid="diff-approved-value"
              style={{
                fontFamily: "var(--font-family-code)",
                fontSize: "var(--font-size-code-sm)",
                color: diff.approvedValue !== null ? "var(--color-text)" : "var(--color-overlay0)",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                maxHeight: "140px",
                overflowY: "auto",
              }}
            >
              {diff.approvedValue !== null ? diff.approvedValue : "(Ausente no XML aprovado)"}
            </div>
          </div>

          {/* Caixa Rejeitado */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2xs)",
              padding: "var(--space-sm)",
              backgroundColor: "rgba(243, 139, 168, 0.06)",
              border: "1px solid rgba(243, 139, 168, 0.3)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <span
              style={{
                fontSize: "var(--font-size-ui-2xs)",
                fontWeight: 700,
                color: "var(--color-red)",
                textTransform: "uppercase",
              }}
            >
              Valor no XML Rejeitado
            </span>
            <div
              data-testid="diff-rejected-value"
              style={{
                fontFamily: "var(--font-family-code)",
                fontSize: "var(--font-size-code-sm)",
                color: diff.rejectedValue !== null ? "var(--color-text)" : "var(--color-overlay0)",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                maxHeight: "140px",
                overflowY: "auto",
              }}
            >
              {diff.rejectedValue !== null ? diff.rejectedValue : "(Ausente no XML rejeitado)"}
            </div>
          </div>
        </div>
      )}

      {/* Atributos Divergentes (se houver) */}
      {diff.attributes && diff.attributes.length > 0 && (
        <div
          data-testid="diff-attributes-table-container"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-xs)",
            marginTop: "var(--space-xs)",
          }}
        >
          <span
            style={{
              fontSize: "var(--font-size-ui-xs)",
              fontWeight: 600,
              color: "var(--color-peach)",
            }}
          >
            Atributos com Divergência:
          </span>
          <div
            style={{
              overflowX: "auto",
              border: "1px solid var(--color-surface0)",
              borderRadius: "var(--radius-xs)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "var(--font-size-code-sm)",
                fontFamily: "var(--font-family-code)",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "var(--color-surface0)", color: "var(--color-subtext1)" }}>
                  <th style={{ padding: "4px 8px", borderBottom: "1px solid var(--color-surface1)" }}>
                    Atributo
                  </th>
                  <th style={{ padding: "4px 8px", borderBottom: "1px solid var(--color-surface1)" }}>
                    Aprovado
                  </th>
                  <th style={{ padding: "4px 8px", borderBottom: "1px solid var(--color-surface1)" }}>
                    Rejeitado
                  </th>
                </tr>
              </thead>
              <tbody>
                {diff.attributes.map((attr) => (
                  <tr key={attr.name} style={{ borderBottom: "1px solid var(--color-surface0)" }}>
                    <td style={{ padding: "4px 8px", color: "var(--color-blue)", fontWeight: 600 }}>
                      @{attr.name}
                    </td>
                    <td style={{ padding: "4px 8px", color: attr.approvedValue ? "var(--color-text)" : "var(--color-overlay0)" }}>
                      {attr.approvedValue ?? "(Ausente)"}
                    </td>
                    <td style={{ padding: "4px 8px", color: attr.rejectedValue ? "var(--color-text)" : "var(--color-overlay0)" }}>
                      {attr.rejectedValue ?? "(Ausente)"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </footer>
  );
}
