"use client";

import React from "react";
import type { Company } from "../domain";

export interface CompanyStatusProps {
  company: Company;
}

export function CompanyStatus({ company }: CompanyStatusProps) {
  const status = company.registrationStatus;

  // Mapeamento de cores de status segundo o tema Catppuccin Mocha
  const getStatusColor = (st: string) => {
    switch (st) {
      case "ATIVA":
        return {
          bg: "rgba(166, 227, 161, 0.12)",
          border: "var(--color-green)",
          text: "var(--color-green)",
          dot: "var(--color-green)",
        };
      case "BAIXADA":
        return {
          bg: "rgba(243, 139, 168, 0.12)",
          border: "var(--color-red)",
          text: "var(--color-red)",
          dot: "var(--color-red)",
        };
      case "INAPTA":
        return {
          bg: "rgba(250, 179, 135, 0.12)",
          border: "var(--color-peach)",
          text: "var(--color-peach)",
          dot: "var(--color-peach)",
        };
      case "SUSPENSA":
        return {
          bg: "rgba(249, 226, 175, 0.12)",
          border: "var(--color-yellow)",
          text: "var(--color-yellow)",
          dot: "var(--color-yellow)",
        };
      default:
        return {
          bg: "rgba(108, 112, 134, 0.15)",
          border: "var(--color-surface2)",
          text: "var(--color-subtext1)",
          dot: "var(--color-overlay0)",
        };
    }
  };

  const colors = getStatusColor(status);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", flexWrap: "wrap" }}>
        {/* Badge da Situação Cadastral */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            padding: "var(--space-2xs) var(--space-md)",
            backgroundColor: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: "var(--radius-xs)",
            color: colors.text,
            fontWeight: 700,
            fontSize: "var(--font-size-ui-sm)",
            letterSpacing: "0.5px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: colors.dot,
            }}
          />
          <span>{status}</span>
        </div>

        {company.registrationStatusDate && (
          <span
            style={{
              fontSize: "var(--font-size-ui-xs)",
              color: "var(--color-subtext1)",
            }}
          >
            desde <strong style={{ color: "var(--color-text)" }}>{company.registrationStatusDate}</strong>
          </span>
        )}
      </div>

      {/* Motivo da Situação (se houver) */}
      {company.registrationStatusReason && company.registrationStatusReason !== "SEM MOTIVO" && (
        <div style={{ fontSize: "var(--font-size-ui-xs)", color: "var(--color-subtext1)" }}>
          <span>Motivo: </span>
          <span style={{ color: "var(--color-text)" }}>{company.registrationStatusReason}</span>
        </div>
      )}

      {/* Situação Especial (se houver) */}
      {company.specialStatus && (
        <div
          style={{
            fontSize: "var(--font-size-ui-xs)",
            color: "var(--color-yellow)",
            backgroundColor: "rgba(249, 226, 175, 0.08)",
            padding: "var(--space-xs) var(--space-sm)",
            borderRadius: "var(--radius-xs)",
            border: "1px solid rgba(249, 226, 175, 0.2)",
            display: "inline-block",
          }}
        >
          <strong>Situação Especial: </strong>
          <span>{company.specialStatus}</span>
          {company.specialStatusDate && <span> (desde {company.specialStatusDate})</span>}
        </div>
      )}
    </div>
  );
}
