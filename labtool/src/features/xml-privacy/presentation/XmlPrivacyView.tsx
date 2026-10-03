"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { SanitizationResult, XmlField } from "../domain/sanitization.types";
import { shouldSelectByDefault } from "../catalog";
import { inspectXml, sanitizeXml } from "../application";
import { formatBytes, XmlUploadDropzone } from "./XmlUploadDropzone";
import { XmlSummaryMetrics } from "./XmlSummaryMetrics";
import { XmlFieldsTable } from "./XmlFieldsTable";
import { XmlCodeViewer } from "./XmlCodeViewer";

/**
 * Visualização principal da ferramenta XML Privacy.
 *
 * Orquestra os dois estágios de interação do usuário:
 * 1. Importação: Upload seguro com validação defensiva e inspeção preliminar;
 * 2. Workspace: Inspeção detalhada de campos, seleção de políticas de privacidade,
 *    recálculo determinístico em tempo real, visualização e download do XML sanitizado.
 */
export function XmlPrivacyView() {
  const [rawXml, setRawXml] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(0);
  const [fields, setFields] = useState<XmlField[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Recálculo da sanitização sempre que o XML original ou a lista de campos sofrer mutação
  const sanitizationResult: SanitizationResult | null = useMemo(() => {
    if (!rawXml || fields.length === 0) {
      return null;
    }
    return sanitizeXml(rawXml, fields);
  }, [rawXml, fields]);

  // Carregamento e inspeção inicial do arquivo XML
  const handleFileLoaded = useCallback((content: string, name: string, size: number) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const inspectedFields = inspectXml(content);
      setRawXml(content);
      setFileName(name);
      setFileSizeBytes(size);
      setFields(inspectedFields);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao inspecionar o arquivo XML.";
      setErrorMessage(msg);
      setRawXml(null);
      setFields([]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Limpeza de estado para novo upload
  const handleReset = useCallback(() => {
    setRawXml(null);
    setFileName("");
    setFileSizeBytes(0);
    setFields([]);
    setErrorMessage(null);
  }, []);

  // Alternar seleção de um campo específico
  const handleToggleField = useCallback((fieldId: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, selected: !f.selected } : f))
    );
  }, []);

  // Selecionar todos os campos elegíveis (não estruturais ou assinaturas)
  const handleSelectAll = useCallback(() => {
    setFields((prev) =>
      prev.map((f) => (!f.hasElementChildren || f.category === "ASSINATURA" ? { ...f, selected: true } : f))
    );
  }, []);

  // Desmarcar todos os campos
  const handleDeselectAll = useCallback(() => {
    setFields((prev) => prev.map((f) => ({ ...f, selected: false })));
  }, []);

  // Restaurar seleção sugerida por padrão pelo catálogo
  const handleRestoreDefaults = useCallback(() => {
    setFields((prev) =>
      prev.map((f) => ({
        ...f,
        selected: (!f.hasElementChildren || f.category === "ASSINATURA") && shouldSelectByDefault(f.category),
      }))
    );
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
        gap: "var(--space-lg)",
        maxWidth: "1440px",
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

          {rawXml && (
            <button
              type="button"
              onClick={handleReset}
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
              Trocar arquivo
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-sm)" }}>
          <div>
            <h1
              style={{
                fontSize: "var(--font-size-ui-xl)",
                fontWeight: 700,
                color: "var(--color-text)",
                lineHeight: "var(--line-height-ui-xl)",
              }}
            >
              XML Privacy
            </h1>
            <p
              style={{
                fontSize: "var(--font-size-ui-sm)",
                color: "var(--color-subtext0)",
              }}
            >
              Sanitização e privacidade segura de documentos fiscais XML.
            </p>
          </div>

          {rawXml && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                fontSize: "var(--font-size-ui-xs)",
                fontFamily: "var(--font-family-code)",
                color: "var(--color-subtext1)",
                backgroundColor: "var(--color-surface0)",
                padding: "var(--space-xs) var(--space-sm)",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--color-surface1)",
              }}
            >
              <strong style={{ color: "var(--color-text)" }}>{fileName}</strong>
              <span>({formatBytes(fileSizeBytes)})</span>
            </div>
          )}
        </div>
      </header>

      {/* Banner de Erro Defensivo */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: "var(--space-sm) var(--space-md)",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "rgba(243, 139, 168, 0.15)",
            border: "1px solid var(--color-red)",
            color: "var(--color-red)",
            fontSize: "var(--font-size-ui-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            <strong>Erro de processamento:</strong> {errorMessage}
          </span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-red)",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "16px",
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* ETAPA 1: Upload (se nenhum XML estiver carregado) */}
      {!rawXml && (
        <main style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)", maxWidth: "800px", margin: "0 auto", width: "100%", paddingTop: "var(--space-xl)" }}>
          <XmlUploadDropzone
            onFileLoaded={handleFileLoaded}
            onError={setErrorMessage}
            isProcessing={isProcessing}
          />
        </main>
      )}

      {/* ETAPA 2: Workspace (se o XML estiver carregado e inspecionado) */}
      {rawXml && sanitizationResult && (
        <main style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)", width: "100%" }}>
          {/* Nota técnica sobre assinatura digital */}
          <div
            style={{
              padding: "var(--space-xs) var(--space-md)",
              borderRadius: "var(--radius-xs)",
              backgroundColor: "rgba(249, 226, 175, 0.1)",
              borderLeft: "3px solid var(--color-yellow)",
              color: "var(--color-subtext1)",
              fontSize: "var(--font-size-ui-xs)",
            }}
          >
            <strong style={{ color: "var(--color-yellow)" }}>Nota de conformidade:</strong> A alteração ou anonimização de conteúdo XML invalida a assinatura digital original do documento. A remoção do bloco de assinatura (`Signature`) é recomendada para fins de compartilhamento seguro.
          </div>

          {/* Sumário de Métricas */}
          <XmlSummaryMetrics summary={sanitizationResult.summary} />

          {/* Visualizador de Código e Exportação (Largura Máxima) */}
          <XmlCodeViewer
            sanitizedXml={sanitizationResult.sanitizedXml}
            originalXml={rawXml}
            originalFileName={fileName}
          />

          {/* Tabela de Campos Inspecionados (Abaixo do visualizador, Largura Máxima) */}
          <XmlFieldsTable
            fields={fields}
            onToggleField={handleToggleField}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onRestoreDefaults={handleRestoreDefaults}
          />
        </main>
      )}
    </div>
  );
}
