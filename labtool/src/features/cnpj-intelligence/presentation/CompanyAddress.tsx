"use client";

import React from "react";
import type { Company } from "../domain";

export interface CompanyAddressProps {
  company: Company;
}

export function CompanyAddressSection({ company }: CompanyAddressProps) {
  const address = company.address;

  if (!address) {
    return (
      <section
        aria-labelledby="section-address"
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
          id="section-address"
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
          Endereço do Estabelecimento
        </h3>
        <span style={{ fontSize: "var(--font-size-ui-sm)", color: "var(--color-subtext0)" }}>
          Endereço não disponível.
        </span>
      </section>
    );
  }

  const fields = [
    { label: "Logradouro", value: address.street || "—" },
    { label: "Número", value: address.number || "S/N" },
    { label: "Complemento", value: address.complement || "—" },
    { label: "Bairro", value: address.neighborhood || "—" },
    { label: "CEP", value: address.zipCode || "—", isMono: true },
    { label: "Município / UF", value: [address.city, address.state].filter(Boolean).join(" / ") || "—" },
  ];

  return (
    <section
      aria-labelledby="section-address"
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
        id="section-address"
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
        Endereço do Estabelecimento
      </h3>

      {/* Endereço Consolidado em Destaque */}
      {address.formattedAddress && (
        <div
          style={{
            backgroundColor: "var(--color-base)",
            border: "1px solid var(--color-surface1)",
            borderRadius: "var(--radius-sm)",
            padding: "var(--space-md)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2xs)",
          }}
        >
          <span
            style={{
              fontSize: "var(--font-size-ui-xs)",
              color: "var(--color-subtext1)",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Endereço Completo
          </span>
          <span
            style={{
              fontSize: "var(--font-size-ui-sm)",
              color: "var(--color-text)",
              lineHeight: "var(--line-height-ui-sm)",
            }}
          >
            {address.formattedAddress}
          </span>
        </div>
      )}

      {/* Detalhamento Semântico dos Campos de Endereço */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "var(--space-md)",
        }}
      >
        {fields.map((f) => (
          <div
            key={f.label}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
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
              {f.label}
            </span>
            <span
              style={{
                fontSize: "var(--font-size-ui-sm)",
                color: "var(--color-text)",
                fontFamily: f.isMono ? "var(--font-family-code)" : "var(--font-family-ui)",
              }}
            >
              {f.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
