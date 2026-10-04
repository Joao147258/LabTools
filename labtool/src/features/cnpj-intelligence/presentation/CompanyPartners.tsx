"use client";

import React from "react";
import type { Company } from "../domain";

export interface CompanyPartnersProps {
  company: Company;
}

export function CompanyPartners({ company }: CompanyPartnersProps) {
  const partners = company.partners || [];

  return (
    <section
      aria-labelledby="section-partners"
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
          alignItems: "center",
          borderBottom: "1px solid var(--color-surface1)",
          paddingBottom: "var(--space-xs)",
        }}
      >
        <h3
          id="section-partners"
          style={{
            fontSize: "var(--font-size-ui-base)",
            fontWeight: 700,
            color: "var(--color-text)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            margin: 0,
          }}
        >
          Quadro de Sócios e Administradores (QSA)
        </h3>
        <span
          style={{
            fontSize: "var(--font-size-ui-xs)",
            color: "var(--color-subtext1)",
            fontFamily: "var(--font-family-code)",
          }}
        >
          {partners.length} {partners.length === 1 ? "integrante" : "integrantes"}
        </span>
      </div>

      {partners.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "var(--space-md)",
          }}
        >
          {partners.map((partner, idx) => (
            <div
              key={`${partner.name}-${idx}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-xs)",
                backgroundColor: "var(--color-base)",
                border: "1px solid var(--color-surface1)",
                borderRadius: "var(--radius-sm)",
                padding: "var(--space-md)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span
                  style={{
                    fontSize: "var(--font-size-ui-sm)",
                    fontWeight: 700,
                    color: "var(--color-text)",
                  }}
                >
                  {partner.name}
                </span>
                {partner.qualification && (
                  <span
                    style={{
                      fontSize: "var(--font-size-ui-xs)",
                      color: "var(--color-blue)",
                      fontWeight: 600,
                    }}
                  >
                    {partner.qualification}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2xs)",
                  fontSize: "var(--font-size-ui-xs)",
                  color: "var(--color-subtext1)",
                  borderTop: "1px solid var(--color-surface0)",
                  paddingTop: "var(--space-xs)",
                }}
              >
                {partner.entryDate && (
                  <div>
                    <span>Data de entrada: </span>
                    <strong style={{ color: "var(--color-text)", fontFamily: "var(--font-family-code)" }}>
                      {partner.entryDate}
                    </strong>
                  </div>
                )}

                {partner.ageRange && (
                  <div>
                    <span>Faixa etária: </span>
                    <span style={{ color: "var(--color-text)" }}>{partner.ageRange}</span>
                  </div>
                )}

                {partner.legalRepresentative?.name && (
                  <div style={{ marginTop: "var(--space-2xs)" }}>
                    <span>Representante Legal: </span>
                    <strong style={{ color: "var(--color-mauve)" }}>
                      {partner.legalRepresentative.name}
                    </strong>
                    {partner.legalRepresentative.qualification && (
                      <span> ({partner.legalRepresentative.qualification})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <span style={{ fontSize: "var(--font-size-ui-sm)", color: "var(--color-subtext0)" }}>
          Nenhum integrante informado ou disponível na base pública para este estabelecimento.
        </span>
      )}
    </section>
  );
}
