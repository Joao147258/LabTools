"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import type { Company } from "../domain";
import { normalizeCnpj } from "../domain";
import { CnpjConsultError } from "../application";
import { consultCnpjUseCase } from "../application";
import type { CnpjGateway } from "../application";
import { BrasilApiClient } from "../infrastructure";
import { CnpjSearch } from "./CnpjSearch";
import { CompanyOverview } from "./CompanyOverview";
import { CompanyRegistration } from "./CompanyRegistration";
import { CompanyActivities } from "./CompanyActivities";
import { CompanyAddressSection } from "./CompanyAddress";
import { CompanyPartners } from "./CompanyPartners";

export type CnpjViewState = "idle" | "loading" | "success" | "not-found" | "error";

const DEFAULT_GATEWAY = new BrasilApiClient();

export interface CnpjIntelligenceViewProps {
  initialCnpj?: string;
  gateway?: CnpjGateway;
}

export function CnpjIntelligenceView({
  initialCnpj = "",
  gateway = DEFAULT_GATEWAY,
}: CnpjIntelligenceViewProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [viewState, setViewState] = useState<CnpjViewState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchedCnpjRef = useRef<string>("");

  const performSearch = useCallback(
    async (cnpjDigits: string) => {
      const clean = normalizeCnpj(cnpjDigits);
      if (!clean) return;

      setViewState("loading");
      setErrorMessage(null);

      try {
        const result = await consultCnpjUseCase({
          cnpj: clean,
          gateway,
        });

        setCompany(result);
        setViewState("success");
      } catch (err: unknown) {
        if (err instanceof CnpjConsultError) {
          if (err.code === "NOT_FOUND") {
            setViewState("not-found");
            setErrorMessage("Nenhuma empresa foi encontrada para este CNPJ.");
          } else if (err.code === "INVALID_CNPJ") {
            setViewState("error");
            setErrorMessage(err.message || "CNPJ inválido.");
          } else if (err.code === "RATE_LIMITED") {
            setViewState("error");
            setErrorMessage(
              "Limite de consultas temporariamente atingido. Aguarde alguns instantes e tente novamente."
            );
          } else if (err.code === "TIMEOUT") {
            setViewState("error");
            setErrorMessage("O servidor demorou muito para responder. Tente novamente.");
          } else {
            setViewState("error");
            setErrorMessage("Não foi possível consultar os dados neste momento.");
          }
        } else {
          setViewState("error");
          setErrorMessage("Não foi possível consultar os dados cadastrais.");
        }
        setCompany(null);
      }
    },
    [gateway]
  );

  useEffect(() => {
    const clean = normalizeCnpj(initialCnpj);
    if (clean && clean !== searchedCnpjRef.current) {
      searchedCnpjRef.current = clean;
      performSearch(clean);
    }
  }, [initialCnpj, performSearch]);

  const handleClear = useCallback(() => {
    searchedCnpjRef.current = "";
    setCompany(null);
    setViewState("idle");
    setErrorMessage(null);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "var(--color-base)",
        color: "var(--color-text)",
        padding: "var(--space-xl)",
        gap: "var(--space-xl)",
        maxWidth: "1280px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Cabeçalho da Ferramenta */}
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-xs)",
          borderBottom: "1px solid var(--color-surface0)",
          paddingBottom: "var(--space-md)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2xs)",
              fontSize: "var(--font-size-ui-sm)",
              color: "var(--color-subtext0)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            &larr; LabTools
          </Link>

          {company && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-xs)",
                padding: "var(--space-xs) var(--space-sm)",
                fontSize: "var(--font-size-ui-xs)",
                color: "var(--color-text)",
                backgroundColor: "var(--color-surface0)",
                border: "1px solid var(--color-surface1)",
                borderRadius: "var(--radius-xs)",
                cursor: "pointer",
              }}
            >
              Nova consulta
            </button>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--space-sm)",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "var(--font-size-ui-xl)",
                fontWeight: 700,
                color: "var(--color-text)",
                lineHeight: "var(--line-height-ui-xl)",
                margin: 0,
              }}
            >
              CNPJ Intelligence
            </h1>
            <p
              style={{
                fontSize: "var(--font-size-ui-sm)",
                color: "var(--color-subtext0)",
                margin: 0,
              }}
            >
              Consulta cadastral, situação fiscal e estrutura societária de pessoas jurídicas.
            </p>
          </div>
        </div>
      </header>

      {/* Barra de Pesquisa */}
      <section
        aria-label="Formulário de consulta de CNPJ"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-sm)",
        }}
      >
        <CnpjSearch
          initialCnpj={initialCnpj}
          isLoading={viewState === "loading"}
          onSearch={(cnpj) => {
            searchedCnpjRef.current = cnpj;
            performSearch(cnpj);
          }}
          onClear={handleClear}
        />
      </section>

      {/* Estados da Interface */}
      {viewState === "idle" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4xl) var(--space-xl)",
            backgroundColor: "var(--color-surface0)",
            border: "1px dashed var(--color-surface1)",
            borderRadius: "var(--radius-lg)",
            textAlign: "center",
            gap: "var(--space-sm)",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-base)",
              border: "1px solid var(--color-surface1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-blue)",
              fontSize: "20px",
              fontFamily: "var(--font-family-code)",
            }}
          >
            #
          </div>
          <h2
            style={{
              fontSize: "var(--font-size-ui-base)",
              fontWeight: 600,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            Nenhuma empresa consultada ainda
          </h2>
          <p
            style={{
              fontSize: "var(--font-size-ui-sm)",
              color: "var(--color-subtext0)",
              maxWidth: "460px",
              margin: 0,
            }}
          >
            Digite um CNPJ válido com ou sem máscara no campo de busca para inspecionar os dados
            cadastrais, CNAEs e quadro societário.
          </p>
        </div>
      )}

      {viewState === "loading" && (
        <div
          role="status"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4xl) var(--space-xl)",
            backgroundColor: "var(--color-surface0)",
            border: "1px solid var(--color-surface1)",
            borderRadius: "var(--radius-lg)",
            textAlign: "center",
            gap: "var(--space-md)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "32px",
              height: "32px",
              border: "3px solid var(--color-surface2)",
              borderTopColor: "var(--color-blue)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span
            style={{
              fontSize: "var(--font-size-ui-base)",
              color: "var(--color-text)",
              fontWeight: 500,
            }}
          >
            Consultando CNPJ...
          </span>
          <span
            style={{
              fontSize: "var(--font-size-ui-xs)",
              color: "var(--color-subtext0)",
            }}
          >
            Obtendo registros cadastrais atualizados da base pública oficial
          </span>
        </div>
      )}

      {viewState === "not-found" && (
        <div
          role="alert"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-3xl) var(--space-xl)",
            backgroundColor: "rgba(249, 226, 175, 0.05)",
            border: "1px solid var(--color-yellow)",
            borderRadius: "var(--radius-lg)",
            textAlign: "center",
            gap: "var(--space-xs)",
          }}
        >
          <span style={{ fontSize: "24px", color: "var(--color-yellow)" }}>&#9888;</span>
          <h3
            style={{
              fontSize: "var(--font-size-ui-base)",
              fontWeight: 600,
              color: "var(--color-yellow)",
              margin: 0,
            }}
          >
            Nenhuma empresa encontrada
          </h3>
          <p
            style={{
              fontSize: "var(--font-size-ui-sm)",
              color: "var(--color-subtext0)",
              margin: 0,
            }}
          >
            {errorMessage || "Nenhuma empresa foi encontrada para este CNPJ."}
          </p>
        </div>
      )}

      {viewState === "error" && (
        <div
          role="alert"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-3xl) var(--space-xl)",
            backgroundColor: "rgba(243, 139, 168, 0.05)",
            border: "1px solid var(--color-red)",
            borderRadius: "var(--radius-lg)",
            textAlign: "center",
            gap: "var(--space-xs)",
          }}
        >
          <span style={{ fontSize: "24px", color: "var(--color-red)" }}>&#10007;</span>
          <h3
            style={{
              fontSize: "var(--font-size-ui-base)",
              fontWeight: 600,
              color: "var(--color-red)",
              margin: 0,
            }}
          >
            Erro na consulta
          </h3>
          <p
            style={{
              fontSize: "var(--font-size-ui-sm)",
              color: "var(--color-subtext0)",
              margin: 0,
            }}
          >
            {errorMessage || "Não foi possível consultar os dados neste momento."}
          </p>
        </div>
      )}

      {/* Conteúdo de Sucesso com Blocos Estruturados */}
      {viewState === "success" && company && (
        <main
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-xl)",
            width: "100%",
          }}
        >
          {/* Cabeçalho da Empresa + Status */}
          <CompanyOverview company={company} />

          {/* Grid de Seções: Identificação e Atividades */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: "var(--space-xl)",
            }}
          >
            <CompanyRegistration company={company} />
            <CompanyActivities company={company} />
          </div>

          {/* Endereço */}
          <CompanyAddressSection company={company} />

          {/* Quadro Societário (QSA) */}
          <CompanyPartners company={company} />
        </main>
      )}
    </div>
  );
}
