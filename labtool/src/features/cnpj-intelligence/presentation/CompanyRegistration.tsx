"use client";

import React from "react";
import type { Company } from "../domain";

export interface CompanyRegistrationProps {
  company: Company;
}

export function CompanyRegistration({ company }: CompanyRegistrationProps) {
  const natureDescription = company.legalNature
    ? [company.legalNature.code, company.legalNature.description].filter(Boolean).join(" - ")
    : null;

  const taxRegimeName = company.taxRegime?.name || "Regime Normal (Lucro Presumido / Real / Outros)";
  const taxRegimeDetails = company.taxRegime?.details;

  const fields = [
    {
      label: "CNPJ",
      value: company.formattedCnpj,
      isMono: true,
    },
    {
      label: "Data de Abertura",
      value: company.openingDate || "—",
      isMono: true,
    },
    {
      label: "Porte da Empresa",
      value: company.companySize || "—",
      isMono: false,
    },
    {
      label: "Capital Social",
      value: company.formattedShareCapital || "—",
      isMono: true,
    },
    {
      label: "Regime Tributário",
      value: taxRegimeName,
      subValue: taxRegimeDetails,
      isMono: false,
      isTaxBadge: true,
      fullWidth: true,
    },
    {
      label: "Natureza Jurídica",
      value: natureDescription || "—",
      isMono: false,
      fullWidth: true,
    },
  ];

  return (
    <section
      aria-labelledby="section-registration"
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
        id="section-registration"
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
        Identificação e Dados Cadastrais
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-lg)",
        }}
      >
        {fields.map((field) => (
          <div
            key={field.label}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2xs)",
              gridColumn: field.fullWidth ? "1 / -1" : undefined,
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
              {field.label}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span
                style={{
                  fontSize: "var(--font-size-ui-sm)",
                  color: field.isTaxBadge ? "var(--color-blue)" : "var(--color-text)",
                  fontWeight: field.isTaxBadge ? 600 : 400,
                  fontFamily: field.isMono ? "var(--font-family-code)" : "var(--font-family-ui)",
                  wordBreak: "break-word",
                }}
              >
                {field.value}
              </span>
              {field.subValue && (
                <span
                  style={{
                    fontSize: "var(--font-size-ui-xs)",
                    color: "var(--color-subtext0)",
                  }}
                >
                  {field.subValue}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
