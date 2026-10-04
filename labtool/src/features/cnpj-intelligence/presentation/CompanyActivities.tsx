"use client";

import React from "react";
import type { Company } from "../domain";

export interface CompanyActivitiesProps {
  company: Company;
}

export function CompanyActivities({ company }: CompanyActivitiesProps) {
  const primary = company.primaryActivity;
  const secondary = company.secondaryActivities || [];

  return (
    <section
      aria-labelledby="section-activities"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        backgroundColor: "var(--color-surface0)",
        border: "1px solid var(--color-surface1)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-xl)",
      }}
    >
      <h3
        id="section-activities"
        style={{
          fontSize: "var(--font-size-ui-base)",
          fontWeight: 700,
          color: "var(--color-text)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          borderBottom: "1px solid var(--color-surface1)",
          paddingBottom: "var(--space-xs)",
          margin: 0,
        }}
      >
        Atividades Econômicas (CNAE)
      </h3>

      {/* Atividade Principal */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
          <span
            style={{
              fontSize: "var(--font-size-ui-2xs)",
              backgroundColor: "rgba(137, 180, 250, 0.15)",
              color: "var(--color-blue)",
              border: "1px solid var(--color-blue)",
              padding: "2px 6px",
              borderRadius: "var(--radius-2xs)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Principal
          </span>
          <span
            style={{
              fontSize: "var(--font-size-ui-xs)",
              color: "var(--color-subtext1)",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Atividade Principal
          </span>
        </div>

        {primary ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2xs)",
              backgroundColor: "var(--color-base)",
              padding: "var(--space-md)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-surface1)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-family-code)",
                fontSize: "var(--font-size-ui-sm)",
                color: "var(--color-sky)",
                fontWeight: 600,
              }}
            >
              {primary.code}
            </span>
            <span
              style={{
                fontSize: "var(--font-size-ui-sm)",
                color: "var(--color-text)",
                lineHeight: "var(--line-height-ui-sm)",
              }}
            >
              {primary.description}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: "var(--font-size-ui-sm)", color: "var(--color-subtext0)" }}>
            Não informada.
          </span>
        )}
      </div>

      {/* Atividades Secundárias */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-xs)",
          borderTop: "1px solid var(--color-surface1)",
          paddingTop: "var(--space-md)",
        }}
      >
        <span
          style={{
            fontSize: "var(--font-size-ui-xs)",
            color: "var(--color-subtext1)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.3px",
          }}
        >
          Atividades Secundárias ({secondary.length})
        </span>

        {secondary.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-xs)",
              maxHeight: "360px",
              overflowY: "auto",
              paddingRight: "var(--space-2xs)",
            }}
          >
            {secondary.map((act, index) => (
              <div
                key={`${act.code}-${index}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  padding: "var(--space-sm) var(--space-md)",
                  backgroundColor: "var(--color-base)",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--color-surface0)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-family-code)",
                    fontSize: "var(--font-size-ui-xs)",
                    color: "var(--color-mauve)",
                    fontWeight: 600,
                  }}
                >
                  {act.code}
                </span>
                <span
                  style={{
                    fontSize: "var(--font-size-ui-xs)",
                    color: "var(--color-text)",
                    lineHeight: "18px",
                  }}
                >
                  {act.description}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: "var(--font-size-ui-xs)", color: "var(--color-subtext0)" }}>
            Nenhuma atividade secundária cadastrada.
          </span>
        )}
      </div>
    </section>
  );
}
