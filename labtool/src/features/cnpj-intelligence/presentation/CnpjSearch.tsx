"use client";

import React, { useState, useCallback } from "react";
import { formatCnpj, normalizeCnpj, validateCnpj } from "../domain/cnpj";

export interface CnpjSearchProps {
  initialCnpj?: string;
  isLoading?: boolean;
  onSearch: (cnpj: string) => void;
  onClear?: () => void;
}

export function CnpjSearch({
  initialCnpj = "",
  isLoading = false,
  onSearch,
  onClear,
}: CnpjSearchProps) {
  const [prevInitialCnpj, setPrevInitialCnpj] = useState(initialCnpj);
  const [inputValue, setInputValue] = useState(() => formatCnpj(initialCnpj));
  const [validationError, setValidationError] = useState<string | null>(null);

  if (initialCnpj !== prevInitialCnpj) {
    setPrevInitialCnpj(initialCnpj);
    setInputValue(formatCnpj(initialCnpj));
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatCnpj(raw);
    setInputValue(formatted);

    // Se o usuário digitou 14 dígitos completos, já valida em tempo real para feedback rápido
    const digits = normalizeCnpj(formatted);
    if (digits.length === 14) {
      if (!validateCnpj(digits)) {
        setValidationError("CNPJ inválido.");
      } else {
        setValidationError(null);
      }
    } else {
      setValidationError(null);
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const digits = normalizeCnpj(inputValue);

      if (!digits) {
        setValidationError("Digite um CNPJ para consultar.");
        return;
      }

      if (!validateCnpj(digits)) {
        setValidationError("CNPJ inválido.");
        return;
      }

      setValidationError(null);
      onSearch(digits);
    },
    [inputValue, onSearch]
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    setValidationError(null);
    if (onClear) onClear();
  }, [onClear]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-xs)",
        width: "100%",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: "var(--space-sm)",
          alignItems: "stretch",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            placeholder="00.000.000/0000-00"
            disabled={isLoading}
            maxLength={18}
            aria-label="Número do CNPJ"
            aria-invalid={Boolean(validationError)}
            style={{
              width: "100%",
              height: "44px",
              padding: "0 var(--space-md)",
              backgroundColor: "var(--color-surface0)",
              border: `1px solid ${
                validationError ? "var(--color-red)" : "var(--color-surface1)"
              }`,
              borderRadius: "var(--radius-sm)",
              color: "var(--color-text)",
              fontFamily: "var(--font-family-code)",
              fontSize: "var(--font-size-ui-base)",
              letterSpacing: "0.5px",
              outline: "none",
              transition: "border-color 0.15s ease",
            }}
          />
          {inputValue && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpar campo de CNPJ"
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--color-subtext0)",
                cursor: "pointer",
                fontSize: "14px",
                padding: "4px",
                lineHeight: 1,
              }}
            >
              &#x2715;
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            height: "44px",
            padding: "0 var(--space-xl)",
            backgroundColor: isLoading ? "var(--color-surface2)" : "var(--color-blue)",
            color: "var(--color-crust)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--font-size-ui-sm)",
            fontWeight: 600,
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-xs)",
            transition: "opacity 0.15s ease, background-color 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          {isLoading ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  border: "2px solid var(--color-crust)",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span>Consultando...</span>
            </>
          ) : (
            <span>Consultar</span>
          )}
        </button>
      </form>

      {validationError && (
        <span
          role="alert"
          style={{
            fontSize: "var(--font-size-ui-xs)",
            color: "var(--color-red)",
            fontWeight: 500,
            paddingLeft: "var(--space-2xs)",
          }}
        >
          {validationError}
        </span>
      )}
    </div>
  );
}
