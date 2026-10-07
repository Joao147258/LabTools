import React from "react";
import type { SanitizationSummary } from "../domain/sanitization.types";

interface XmlSummaryMetricsProps {
  summary: SanitizationSummary;
}

/**
 * Painel de métricas quantitativas consolidadas da operação de sanitização.
 */
export function XmlSummaryMetrics({ summary }: XmlSummaryMetricsProps) {
  const metrics = [
    {
      label: "Campos Detectados",
      value: summary.fieldsFound,
      color: "var(--color-text)",
      badgeBg: "var(--color-surface1)",
    },
    {
      label: "Campos Higienizados",
      value: summary.fieldsSanitized,
      color: "var(--color-blue)",
      badgeBg: "rgba(137, 180, 250, 0.15)",
    },
    {
      label: "Substituídos",
      value: summary.fieldsReplaced,
      color: "var(--color-peach)",
      badgeBg: "rgba(250, 179, 135, 0.15)",
    },
    {
      label: "Anonimizados em Texto",
      value: summary.fieldsScrubbed,
      color: "var(--color-yellow)",
      badgeBg: "rgba(249, 226, 175, 0.15)",
    },
    {
      label: "Subárvores Removidas",
      value: summary.subtreesRemoved,
      color: "var(--color-red)",
      badgeBg: "rgba(243, 139, 168, 0.15)",
    },
  ];

  return (
    <div
      data-testid="xml-summary-metrics"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "var(--space-sm)",
        width: "100%",
      }}
    >
      {metrics.map((metric) => (
        <div
          key={metric.label}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2xs)",
            padding: "var(--space-sm) var(--space-md)",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--color-surface0)",
            border: "1px solid var(--color-surface1)",
          }}
        >
          <span
            style={{
              fontSize: "var(--font-size-ui-xs)",
              color: "var(--color-subtext0)",
              fontWeight: 500,
            }}
          >
            {metric.label}
          </span>
          <span
            style={{
              fontSize: "var(--font-size-ui-xl)",
              fontWeight: 700,
              fontFamily: "var(--font-family-code)",
              color: metric.color,
              lineHeight: "var(--line-height-ui-xl)",
            }}
          >
            {metric.value}
          </span>
        </div>
      ))}
    </div>
  );
}
