"use client";

import React from "react";
import type { XmlComparisonDiff, XmlComparisonSummary } from "../domain";

export interface ComparatorSummaryProps {
  summary: XmlComparisonSummary;
  diffs: XmlComparisonDiff[];
  selectedDiffId: string | null;
  onSelectDiff: (diffId: string) => void;
  onNavigate?: (direction: "prev" | "next") => void;
}

/**
 * Componente de visualização do resumo quantitativo e métricas da comparação estrutural.
 */
export function ComparatorSummary({
  summary,
  diffs,
  selectedDiffId,
  onSelectDiff,
  onNavigate,
}: ComparatorSummaryProps) {
  const currentIndex = selectedDiffId
    ? diffs.findIndex((d) => d.id === selectedDiffId)
    : -1;

  if (summary.identical) {
    return (
      <section
        data-testid="comparator-summary-identical"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-md) var(--space-lg)",
          backgroundColor: "rgba(166, 227, 161, 0.12)",
          border: "1px solid var(--color-green)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-green)",
          gap: "var(--space-md)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <span style={{ fontSize: "20px" }}>&#10003;</span>
          <div>
            <strong style={{ fontSize: "var(--font-size-ui-base)" }}>
              Nenhuma divergência encontrada.
            </strong>
            <p
              style={{
                fontSize: "var(--font-size-ui-sm)",
                color: "var(--color-subtext1)",
                margin: 0,
              }}
            >
              Os documentos XML aprovado e rejeitado possuem estrutura, tags, atributos e valores equivalentes.
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: "var(--font-size-code-md)",
            fontFamily: "var(--font-family-code)",
            padding: "var(--space-2xs) var(--space-sm)",
            backgroundColor: "var(--color-surface0)",
            borderRadius: "var(--radius-xs)",
            border: "1px solid var(--color-surface1)",
            color: "var(--color-text)",
          }}
        >
          0 divergências
        </span>
      </section>
    );
  }

  return (
    <section
      data-testid="comparator-summary"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
        padding: "var(--space-md)",
        backgroundColor: "var(--color-mantle)",
        border: "1px solid var(--color-surface0)",
        borderRadius: "var(--radius-md)",
      }}
    >
      {/* Linha superior: métricas */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flexWrap: "wrap" }}>
          {/* Total */}
          <div
            data-testid="metric-total-diffs"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              padding: "var(--space-2xs) var(--space-sm)",
              backgroundColor: "var(--color-surface0)",
              border: "1px solid var(--color-surface1)",
              borderRadius: "var(--radius-xs)",
              fontSize: "var(--font-size-ui-xs)",
              color: "var(--color-text)",
            }}
          >
            <span>Total:</span>
            <strong
              style={{
                fontFamily: "var(--font-family-code)",
                color: "var(--color-blue)",
              }}
            >
              {summary.totalDiffs}
            </strong>
          </div>

          {/* Apenas no Aprovado */}
          {summary.onlyInApproved > 0 && (
            <div
              data-testid="metric-only-in-approved"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-xs)",
                padding: "var(--space-2xs) var(--space-sm)",
                backgroundColor: "rgba(166, 227, 161, 0.12)",
                border: "1px solid var(--color-green)",
                borderRadius: "var(--radius-xs)",
                fontSize: "var(--font-size-ui-xs)",
                color: "var(--color-green)",
              }}
            >
              <span>+ Apenas no Aprovado:</span>
              <strong style={{ fontFamily: "var(--font-family-code)" }}>
                {summary.onlyInApproved}
              </strong>
            </div>
          )}

          {/* Apenas no Rejeitado */}
          {summary.onlyInRejected > 0 && (
            <div
              data-testid="metric-only-in-rejected"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-xs)",
                padding: "var(--space-2xs) var(--space-sm)",
                backgroundColor: "rgba(243, 139, 168, 0.12)",
                border: "1px solid var(--color-red)",
                borderRadius: "var(--radius-xs)",
                fontSize: "var(--font-size-ui-xs)",
                color: "var(--color-red)",
              }}
            >
              <span>- Apenas no Rejeitado:</span>
              <strong style={{ fontFamily: "var(--font-family-code)" }}>
                {summary.onlyInRejected}
              </strong>
            </div>
          )}

          {/* Divergências de Valor */}
          {summary.valueDiffs > 0 && (
            <div
              data-testid="metric-value-diffs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-xs)",
                padding: "var(--space-2xs) var(--space-sm)",
                backgroundColor: "rgba(249, 226, 175, 0.12)",
                border: "1px solid var(--color-yellow)",
                borderRadius: "var(--radius-xs)",
                fontSize: "var(--font-size-ui-xs)",
                color: "var(--color-yellow)",
              }}
            >
              <span>Divergência de Valor:</span>
              <strong style={{ fontFamily: "var(--font-family-code)" }}>
                {summary.valueDiffs}
              </strong>
            </div>
          )}

          {/* Atributos Divergentes */}
          {summary.attributeDiffs > 0 && (
            <div
              data-testid="metric-attribute-diffs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-xs)",
                padding: "var(--space-2xs) var(--space-sm)",
                backgroundColor: "rgba(250, 179, 135, 0.12)",
                border: "1px solid var(--color-peach)",
                borderRadius: "var(--radius-xs)",
                fontSize: "var(--font-size-ui-xs)",
                color: "var(--color-peach)",
              }}
            >
              <span>Atributos Divergentes:</span>
              <strong style={{ fontFamily: "var(--font-family-code)" }}>
                {summary.attributeDiffs}
              </strong>
            </div>
          )}

          {/* Estrutural */}
          {summary.structureDiffs > 0 && (
            <div
              data-testid="metric-structure-diffs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-xs)",
                padding: "var(--space-2xs) var(--space-sm)",
                backgroundColor: "rgba(116, 199, 236, 0.12)",
                border: "1px solid var(--color-sapphire)",
                borderRadius: "var(--radius-xs)",
                fontSize: "var(--font-size-ui-xs)",
                color: "var(--color-sapphire)",
              }}
            >
              <span>Estrutural:</span>
              <strong style={{ fontFamily: "var(--font-family-code)" }}>
                {summary.structureDiffs}
              </strong>
            </div>
          )}

          {/* Contextuais */}
          {summary.contextualDiffs > 0 && (
            <div
              data-testid="metric-contextual-diffs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-xs)",
                padding: "var(--space-2xs) var(--space-sm)",
                backgroundColor: "rgba(137, 220, 235, 0.10)",
                border: "1px solid var(--color-sky)",
                borderRadius: "var(--radius-xs)",
                fontSize: "var(--font-size-ui-xs)",
                color: "var(--color-sky)",
              }}
            >
              <span>Contextuais:</span>
              <strong style={{ fontFamily: "var(--font-family-code)" }}>
                {summary.contextualDiffs}
              </strong>
            </div>
          )}
        </div>

        {/* Controles de Navegação Rápida entre Diffs */}
        {diffs.length > 0 && onNavigate && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
            }}
          >
            <span
              style={{
                fontSize: "var(--font-size-ui-xs)",
                fontFamily: "var(--font-family-code)",
                color: "var(--color-subtext1)",
              }}
            >
              {currentIndex >= 0 ? `${currentIndex + 1} de ${diffs.length}` : `0 de ${diffs.length}`}
            </span>
            <button
              type="button"
              data-testid="nav-prev-diff-button"
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
              data-testid="nav-next-diff-button"
              onClick={() => onNavigate("next")}
              disabled={currentIndex >= diffs.length - 1}
              aria-label="Próxima divergência"
              style={{
                padding: "var(--space-2xs) var(--space-xs)",
                fontSize: "var(--font-size-ui-xs)",
                backgroundColor: "var(--color-surface0)",
                border: "1px solid var(--color-surface1)",
                borderRadius: "var(--radius-xs)",
                color: currentIndex >= diffs.length - 1 ? "var(--color-overlay0)" : "var(--color-text)",
                cursor: currentIndex >= diffs.length - 1 ? "not-allowed" : "pointer",
              }}
            >
              Próxima &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Lista seletora compacta de diffs */}
      {diffs.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            overflowX: "auto",
            paddingTop: "var(--space-2xs)",
          }}
        >
          <span
            style={{
              fontSize: "var(--font-size-ui-2xs)",
              color: "var(--color-subtext0)",
              whiteSpace: "nowrap",
            }}
          >
            Saltar para:
          </span>
          <div
            style={{
              display: "flex",
              gap: "var(--space-2xs)",
              overflowX: "auto",
              paddingBottom: "2px",
            }}
          >
            {diffs.map((d, idx) => {
              const isSelected = d.id === selectedDiffId;
              let badgeColor = "var(--color-surface2)";
              if (d.kind === "ONLY_IN_APPROVED") badgeColor = "var(--color-green)";
              else if (d.kind === "ONLY_IN_REJECTED") badgeColor = "var(--color-red)";
              else if (d.kind === "VALUE_DIFF") badgeColor = "var(--color-yellow)";
              else if (d.kind === "ATTRIBUTE_DIFF") badgeColor = "var(--color-peach)";
              else if (d.kind === "STRUCTURE_DIFF") badgeColor = "var(--color-sapphire)";

              return (
                <button
                  key={d.id}
                  type="button"
                  data-testid={`jump-diff-${idx}`}
                  onClick={() => onSelectDiff(d.id)}
                  style={{
                    padding: "2px 6px",
                    fontSize: "var(--font-size-code-sm)",
                    fontFamily: "var(--font-family-code)",
                    borderRadius: "var(--radius-xs)",
                    border: isSelected
                      ? "1px solid var(--color-mauve)"
                      : "1px solid var(--color-surface1)",
                    backgroundColor: isSelected
                      ? "rgba(203, 166, 247, 0.20)"
                      : "var(--color-surface0)",
                    color: isSelected ? "var(--color-mauve)" : "var(--color-text)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: badgeColor,
                    }}
                  />
                  <span>
                    #{idx + 1} {d.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
