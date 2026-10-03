"use client";

import React from "react";
import type { XmlComparisonDiff } from "../domain";
import type { MirroredComparisonRow } from "./mirrored-rows";

export interface MirroredXmlRowProps {
  row: MirroredComparisonRow;
  isSelected: boolean;
  selectedDiffId: string | null;
  onSelectRow: (row: MirroredComparisonRow) => void;
  registerRowRef?: (rowId: string, el: HTMLDivElement | null) => void;
}

function getDiffKindLabel(kind: XmlComparisonDiff["kind"]): string {
  switch (kind) {
    case "ONLY_IN_APPROVED":
      return "+ Aprovado";
    case "ONLY_IN_REJECTED":
      return "- Rejeitado";
    case "VALUE_DIFF":
      return "Valor";
    case "ATTRIBUTE_DIFF":
      return "Atributo";
    case "STRUCTURE_DIFF":
      return "Estrutura";
    case "CONTEXTUAL_DIFF":
      return "Contexto";
    default:
      return "Divergência";
  }
}

function getDiffColors(kind: XmlComparisonDiff["kind"]): {
  bg: string;
  border: string;
  badgeBg: string;
  badgeColor: string;
} {
  switch (kind) {
    case "ONLY_IN_APPROVED":
      return {
        bg: "rgba(166, 227, 161, 0.12)",
        border: "var(--color-green)",
        badgeBg: "rgba(166, 227, 161, 0.25)",
        badgeColor: "var(--color-green)",
      };
    case "ONLY_IN_REJECTED":
      return {
        bg: "rgba(243, 139, 168, 0.12)",
        border: "var(--color-red)",
        badgeBg: "rgba(243, 139, 168, 0.25)",
        badgeColor: "var(--color-red)",
      };
    case "VALUE_DIFF":
      return {
        bg: "rgba(249, 226, 175, 0.12)",
        border: "var(--color-yellow)",
        badgeBg: "rgba(249, 226, 175, 0.25)",
        badgeColor: "var(--color-yellow)",
      };
    case "ATTRIBUTE_DIFF":
      return {
        bg: "rgba(250, 179, 135, 0.12)",
        border: "var(--color-peach)",
        badgeBg: "rgba(250, 179, 135, 0.25)",
        badgeColor: "var(--color-peach)",
      };
    case "STRUCTURE_DIFF":
      return {
        bg: "rgba(116, 199, 236, 0.12)",
        border: "var(--color-sapphire)",
        badgeBg: "rgba(116, 199, 236, 0.25)",
        badgeColor: "var(--color-sapphire)",
      };
    case "CONTEXTUAL_DIFF":
      return {
        bg: "rgba(137, 220, 235, 0.10)",
        border: "var(--color-sky)",
        badgeBg: "rgba(137, 220, 235, 0.25)",
        badgeColor: "var(--color-sky)",
      };
    default:
      return {
        bg: "rgba(137, 180, 250, 0.10)",
        border: "var(--color-blue)",
        badgeBg: "rgba(137, 180, 250, 0.25)",
        badgeColor: "var(--color-blue)",
      };
  }
}

/**
 * Renderiza uma linha única da comparação espelhada contendo o lado aprovado e o lado rejeitado.
 *
 * Características:
 * - Layout CSS Grid de 2 colunas com altura compartilhada automaticamente;
 * - Quebra de linha segura com white-space: pre-wrap e word-break: break-word;
 * - Número de linha fixo (flex-shrink: 0) sem sofrer quebra;
 * - Suporte a slot vazio (null) quando o elemento existe apenas em um dos documentos;
 * - Seleção compartilhada destacando ambos os lados e slot vazio simultaneamente.
 */
export function MirroredXmlRow({
  row,
  isSelected,
  selectedDiffId,
  onSelectRow,
  registerRowRef,
}: MirroredXmlRowProps) {
  const hasDiff = row.diffs.length > 0;
  const primaryDiff = hasDiff
    ? (selectedDiffId ? row.diffs.find((d) => d.id === selectedDiffId) : null) ?? row.diffs[0]
    : null;

  let rowBg = "transparent";
  let approvedCellBg = "transparent";
  let rejectedCellBg = "transparent";
  let approvedBorderLeft = "3px solid transparent";
  let rejectedBorderLeft = "3px solid transparent";
  let badge: React.ReactNode = null;

  if (primaryDiff) {
    const colors = getDiffColors(primaryDiff.kind);

    if (primaryDiff.kind === "ONLY_IN_APPROVED") {
      approvedCellBg = colors.bg;
      approvedBorderLeft = `3px solid ${colors.border}`;
      rejectedCellBg = "rgba(243, 139, 168, 0.04)";
      rejectedBorderLeft = "3px solid rgba(243, 139, 168, 0.3)";
    } else if (primaryDiff.kind === "ONLY_IN_REJECTED") {
      rejectedCellBg = colors.bg;
      rejectedBorderLeft = `3px solid ${colors.border}`;
      approvedCellBg = "rgba(166, 227, 161, 0.04)";
      approvedBorderLeft = "3px solid rgba(166, 227, 161, 0.3)";
    } else {
      approvedCellBg = colors.bg;
      rejectedCellBg = colors.bg;
      approvedBorderLeft = `3px solid ${colors.border}`;
      rejectedBorderLeft = `3px solid ${colors.border}`;
    }

    badge = (
      <span
        style={{
          marginLeft: "auto",
          fontSize: "9px",
          fontWeight: 600,
          padding: "1px 4px",
          borderRadius: "2px",
          backgroundColor: colors.badgeBg,
          color: colors.badgeColor,
          whiteSpace: "nowrap",
          userSelect: "none",
          flexShrink: 0,
          alignSelf: "flex-start",
          marginTop: "1px",
        }}
      >
        {getDiffKindLabel(primaryDiff.kind)}
      </span>
    );
  }

  if (isSelected) {
    rowBg = "rgba(203, 166, 247, 0.22)";
    approvedCellBg = "rgba(203, 166, 247, 0.22)";
    rejectedCellBg = "rgba(203, 166, 247, 0.22)";
    approvedBorderLeft = "3px solid var(--color-mauve)";
    rejectedBorderLeft = "3px solid var(--color-mauve)";
  }

  return (
    <div
      ref={(el) => {
        if (registerRowRef) {
          registerRowRef(row.id, el);
        }
      }}
      data-testid={`mirrored-row-${row.id}`}
      data-row-id={row.id}
      data-path={row.path || undefined}
      data-diff-id={primaryDiff?.id || undefined}
      onClick={() => onSelectRow(row)}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        backgroundColor: rowBg,
        borderBottom: "1px solid rgba(69, 71, 90, 0.2)",
        outline: isSelected ? "1px solid var(--color-mauve)" : "none",
        cursor: hasDiff ? "pointer" : "default",
        transition: "background-color 0.1s ease",
      }}
    >
      {/* Célula Esquerda: XML Aprovado */}
      <div
        data-testid={row.approvedLineNumber ? `approved-line-${row.approvedLineNumber}` : undefined}
        data-line-number={row.approvedLineNumber ?? undefined}
        data-path={row.approved?.path || undefined}
        data-diff-id={primaryDiff?.id || undefined}
        style={{
          display: "flex",
          alignItems: "flex-start",
          padding: "2px var(--space-sm)",
          borderRight: "1px solid var(--color-surface0)",
          borderLeft: approvedBorderLeft,
          backgroundColor: approvedCellBg,
          gap: "var(--space-sm)",
          minWidth: 0,
          height: "100%",
        }}
      >
        {/* Número da Linha no Aprovado */}
        <span
          style={{
            width: "36px",
            textAlign: "right",
            color: hasDiff ? "var(--color-subtext1)" : "var(--color-overlay0)",
            fontWeight: hasDiff ? 600 : 400,
            userSelect: "none",
            flexShrink: 0,
            paddingTop: "1px",
            fontSize: "var(--font-size-code-sm)",
            fontFamily: "var(--font-family-code)",
          }}
        >
          {row.approvedLineNumber ?? ""}
        </span>

        {/* Conteúdo XML formatado ou Slot Vazio */}
        {row.approved ? (
          <code
            style={{
              color: isSelected
                ? "var(--color-text)"
                : hasDiff
                ? "var(--color-text)"
                : "var(--color-subtext1)",
              fontFamily: "var(--font-family-code)",
              fontSize: "var(--font-size-code-sm)",
              lineHeight: "var(--line-height-code-sm)",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
              minWidth: 0,
              flex: "1 1 auto",
              paddingTop: "1px",
            }}
          >
            {row.approved.text}
          </code>
        ) : (
          <div
            data-testid="approved-empty-slot"
            style={{
              flex: "1 1 auto",
              minHeight: "18px",
              color: "var(--color-overlay0)",
              fontStyle: "italic",
              opacity: 0.5,
              userSelect: "none",
            }}
          />
        )}

        {/* Badge se aplicável ao lado aprovado */}
        {primaryDiff && (primaryDiff.kind === "ONLY_IN_APPROVED" || primaryDiff.kind === "ATTRIBUTE_DIFF" || primaryDiff.kind === "STRUCTURE_DIFF") && badge}
      </div>

      {/* Célula Direita: XML Rejeitado */}
      <div
        data-testid={row.rejectedLineNumber ? `rejected-line-${row.rejectedLineNumber}` : undefined}
        data-line-number={row.rejectedLineNumber ?? undefined}
        data-path={row.rejected?.path || undefined}
        data-diff-id={primaryDiff?.id || undefined}
        style={{
          display: "flex",
          alignItems: "flex-start",
          padding: "2px var(--space-sm)",
          borderLeft: rejectedBorderLeft,
          backgroundColor: rejectedCellBg,
          gap: "var(--space-sm)",
          minWidth: 0,
          height: "100%",
        }}
      >
        {/* Número da Linha no Rejeitado */}
        <span
          style={{
            width: "36px",
            textAlign: "right",
            color: hasDiff ? "var(--color-subtext1)" : "var(--color-overlay0)",
            fontWeight: hasDiff ? 600 : 400,
            userSelect: "none",
            flexShrink: 0,
            paddingTop: "1px",
            fontSize: "var(--font-size-code-sm)",
            fontFamily: "var(--font-family-code)",
          }}
        >
          {row.rejectedLineNumber ?? ""}
        </span>

        {/* Conteúdo XML formatado ou Slot Vazio */}
        {row.rejected ? (
          <code
            style={{
              color: isSelected
                ? "var(--color-text)"
                : hasDiff
                ? "var(--color-text)"
                : "var(--color-subtext1)",
              fontFamily: "var(--font-family-code)",
              fontSize: "var(--font-size-code-sm)",
              lineHeight: "var(--line-height-code-sm)",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
              minWidth: 0,
              flex: "1 1 auto",
              paddingTop: "1px",
            }}
          >
            {row.rejected.text}
          </code>
        ) : (
          <div
            data-testid="rejected-empty-slot"
            style={{
              flex: "1 1 auto",
              minHeight: "18px",
              color: "var(--color-overlay0)",
              fontStyle: "italic",
              opacity: 0.5,
              userSelect: "none",
            }}
          />
        )}

        {/* Badge se aplicável ao lado rejeitado */}
        {primaryDiff && (primaryDiff.kind === "ONLY_IN_REJECTED" || primaryDiff.kind === "VALUE_DIFF" || primaryDiff.kind === "CONTEXTUAL_DIFF") && badge}
      </div>
    </div>
  );
}
