"use client";

import React, { useEffect, useRef } from "react";
import type { FormattedLine, LoadedFile, XmlComparisonDiff } from "../domain";
import { formatBytes } from "./ComparatorUploadArea";

export interface ComparatorXmlPanelProps {
  title: string;
  panelType: "approved" | "rejected";
  file: LoadedFile | null;
  lines: FormattedLine[];
  elementCount?: number;
  diffsByPath: Map<string, XmlComparisonDiff[]>;
  selectedDiffId: string | null;
  selectedPath: string | null;
  onSelectDiff: (diff: XmlComparisonDiff) => void;
  emptyMessage?: string;
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
 * Painel de visualização de um documento XML formatado em linhas com realce sincronizado de diferenças.
 */
export function ComparatorXmlPanel({
  title,
  panelType,
  file,
  lines,
  elementCount,
  diffsByPath,
  selectedDiffId,
  selectedPath,
  onSelectDiff,
  emptyMessage = "Nenhum arquivo carregado para este painel.",
}: ComparatorXmlPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Rolar suavemente até a linha selecionada quando houver mudança de path ou diff selecionado
  useEffect(() => {
    if (!selectedPath || lines.length === 0) return;

    const targetLineIndex = lines.findIndex((l) => l.path === selectedPath);
    if (targetLineIndex >= 0) {
      const lineEl = lineRefs.current.get(targetLineIndex);
      if (lineEl && containerRef.current && typeof lineEl.scrollIntoView === "function") {
        try {
          lineEl.scrollIntoView({ block: "center", behavior: "smooth" });
        } catch {
          // Fallback para ambientes sem suporte a smooth scroll (ex: jsdom)
          lineEl.scrollIntoView();
        }
      }
    }
  }, [selectedPath, selectedDiffId, lines]);

  return (
    <section
      data-testid={`comparator-${panelType}-panel`}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: "1 1 0",
        minWidth: "320px",
        backgroundColor: "var(--color-base)",
        border: "1px solid var(--color-surface1)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      {/* Cabeçalho do Painel */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-sm) var(--space-md)",
          backgroundColor: "var(--color-mantle)",
          borderBottom: "1px solid var(--color-surface0)",
          gap: "var(--space-sm)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <span
            style={{
              fontSize: "var(--font-size-ui-xs)",
              fontWeight: 700,
              color: panelType === "approved" ? "var(--color-green)" : "var(--color-red)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {title}
          </span>
          {file && (
            <span
              style={{
                fontFamily: "var(--font-family-code)",
                fontSize: "var(--font-size-code-sm)",
                color: "var(--color-subtext1)",
                backgroundColor: "var(--color-surface0)",
                padding: "2px 6px",
                borderRadius: "var(--radius-xs)",
                maxWidth: "220px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={file.name}
            >
              {file.name} ({formatBytes(file.size)})
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
          {elementCount !== undefined && elementCount > 0 && (
            <span
              data-testid={`${panelType}-element-count`}
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
              {elementCount} {elementCount === 1 ? "elemento" : "elementos"}
            </span>
          )}
          {lines.length > 0 && (
            <span
              data-testid={`${panelType}-line-count`}
              style={{
                fontSize: "var(--font-size-ui-2xs)",
                fontFamily: "var(--font-family-code)",
                color: "var(--color-subtext0)",
              }}
            >
              ({lines.length} linhas)
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo com Linhas XML */}
      <div
        ref={containerRef}
        data-testid={`comparator-${panelType}-lines-container`}
        style={{
          flex: "1 1 auto",
          overflowY: "auto",
          overflowX: "auto",
          maxHeight: "520px",
          minHeight: "260px",
          backgroundColor: "var(--color-crust)",
          fontFamily: "var(--font-family-code)",
          fontSize: "var(--font-size-code-sm)",
          lineHeight: "var(--line-height-code-sm)",
        }}
      >
        {lines.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "260px",
              color: "var(--color-overlay0)",
              fontSize: "var(--font-size-ui-sm)",
              padding: "var(--space-lg)",
              textAlign: "center",
            }}
          >
            {emptyMessage}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", minWidth: "max-content", padding: "var(--space-xs) 0" }}>
            {lines.map((line, idx) => {
              const diffsForLine = line.path ? diffsByPath.get(line.path) ?? [] : [];
              const hasDiff = diffsForLine.length > 0;
              const primaryDiff = hasDiff ? diffsForLine[0] : null;
              const isSelected =
                primaryDiff !== null &&
                (primaryDiff.id === selectedDiffId || primaryDiff.path === selectedPath);

              let rowBg = "transparent";
              let rowBorderLeft = "3px solid transparent";
              let badge = null;

              if (primaryDiff) {
                const colors = getDiffColors(primaryDiff.kind);
                rowBg = isSelected ? "rgba(137, 180, 250, 0.22)" : colors.bg;
                rowBorderLeft = isSelected
                  ? "3px solid var(--color-blue)"
                  : `3px solid ${colors.border}`;

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
                    }}
                  >
                    {getDiffKindLabel(primaryDiff.kind)}
                  </span>
                );
              }

              return (
                <div
                  key={idx}
                  ref={(el) => {
                    if (el) lineRefs.current.set(idx, el);
                    else lineRefs.current.delete(idx);
                  }}
                  data-testid={`${panelType}-line-${idx + 1}`}
                  data-line-number={idx + 1}
                  data-path={line.path || undefined}
                  data-diff-id={primaryDiff?.id || undefined}
                  onClick={() => {
                    if (primaryDiff) {
                      onSelectDiff(primaryDiff);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "2px var(--space-sm)",
                    backgroundColor: rowBg,
                    borderLeft: rowBorderLeft,
                    outline: isSelected ? "1px solid var(--color-blue)" : "none",
                    cursor: hasDiff ? "pointer" : "default",
                    gap: "var(--space-sm)",
                    transition: "background-color 0.1s ease",
                  }}
                >
                  {/* Número da Linha */}
                  <span
                    style={{
                      width: "36px",
                      textAlign: "right",
                      color: hasDiff ? "var(--color-subtext1)" : "var(--color-overlay0)",
                      fontWeight: hasDiff ? 600 : 400,
                      userSelect: "none",
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>

                  {/* Texto da Linha XML */}
                  <span
                    style={{
                      color: isSelected
                        ? "var(--color-text)"
                        : hasDiff
                        ? "var(--color-text)"
                        : "var(--color-subtext1)",
                      whiteSpace: "pre",
                      flexGrow: 1,
                    }}
                  >
                    {line.text}
                  </span>

                  {/* Badge de Diff */}
                  {badge}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
