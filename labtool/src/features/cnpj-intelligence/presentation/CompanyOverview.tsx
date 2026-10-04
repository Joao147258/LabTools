"use client";

import React, { useState, useCallback } from "react";
import type { Company } from "../domain";
import { CompanyStatus } from "./CompanyStatus";

export interface CompanyOverviewProps {
  company: Company;
}

export function CompanyOverview({ company }: CompanyOverviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCnpj = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(company.cnpj);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [company.cnpj]);

  return (
    <div
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "var(--space-lg)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)", flex: "1 1 300px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "var(--font-family-code)",
                fontSize: "var(--font-size-ui-sm)",
                color: "var(--color-blue)",
                fontWeight: 600,
              }}
            >
              {company.formattedCnpj}
            </span>

            <button
              type="button"
              onClick={handleCopyCnpj}
              title="Copiar CNPJ limpo"
              style={{
                padding: "2px 8px",
                fontSize: "var(--font-size-ui-2xs)",
                backgroundColor: "var(--color-base)",
                color: copied ? "var(--color-green)" : "var(--color-subtext1)",
                border: "1px solid var(--color-surface1)",
                borderRadius: "var(--radius-2xs)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {copied ? "✓ Copiado" : "Copiar"}
            </button>
          </div>

          <h2
            style={{
              fontSize: "var(--font-size-ui-xl)",
              lineHeight: "var(--line-height-ui-xl)",
              fontWeight: 700,
              color: "var(--color-text)",
              letterSpacing: "-0.3px",
              margin: 0,
            }}
          >
            {company.legalName}
          </h2>

          {company.tradeName && (
            <p
              style={{
                fontSize: "var(--font-size-ui-base)",
                color: "var(--color-subtext1)",
                margin: 0,
              }}
            >
              Nome Fantasia: <strong style={{ color: "var(--color-text)" }}>{company.tradeName}</strong>
            </p>
          )}
        </div>

        <div style={{ alignSelf: "flex-start" }}>
          <CompanyStatus company={company} />
        </div>
      </div>
    </div>
  );
}
