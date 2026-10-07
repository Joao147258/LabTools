import React, { useState } from "react";

interface XmlCodeViewerProps {
  sanitizedXml: string;
  originalXml: string;
  originalFileName: string;
}

/**
 * Escapa com segurança todos os caracteres especiais de HTML para prevenção estrita de XSS.
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Realça visualmente tokens sintéticos de sanitização (ex: [CPF_001]) sobre uma string previamente escapada em HTML.
 */
export function highlightSanitizedTokens(escapedXml: string): string {
  // Regex segura operando exclusivamente sobre texto já escapado
  return escapedXml.replace(
    /\[([A-Z_]+_\d{3})\]/g,
    '<span style="color: var(--color-peach); font-weight: bold; background: rgba(250, 179, 135, 0.15); padding: 1px 4px; border-radius: 3px;">[$1]</span>'
  );
}

/**
 * Componente visualizador de código XML com alternância de abas, cópia e download local.
 */
export function XmlCodeViewer({
  sanitizedXml,
  originalXml,
  originalFileName,
}: XmlCodeViewerProps) {
  const [activeTab, setActiveTab] = useState<"sanitized" | "original">("sanitized");
  const [copied, setCopied] = useState<boolean>(false);

  const activeContent = activeTab === "sanitized" ? sanitizedXml : originalXml;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(activeContent);
      } else {
        // Fallback para textarea temporária
        const textArea = document.createElement("textarea");
        textArea.value = activeContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignorar falhas silenciosas de clipboard sem travar a UI
    }
  };

  const handleDownload = () => {
    try {
      const baseName = originalFileName.replace(/\.xml$/i, "");
      const downloadName = `${baseName}-sanitizado.xml`;

      const blob = new Blob([sanitizedXml], { type: "application/xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback
    }
  };

  const escapedContent = escapeHtml(activeContent);
  const htmlToRender = activeTab === "sanitized" ? highlightSanitizedTokens(escapedContent) : escapedContent;

  return (
    <div
      data-testid="xml-code-viewer"
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--color-surface0)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-surface1)",
        overflow: "hidden",
      }}
    >
      {/* Barra Superior com Abas e Ações */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--color-mantle)",
          borderBottom: "1px solid var(--color-surface1)",
          padding: "var(--space-xs) var(--space-md)",
          gap: "var(--space-sm)",
        }}
      >
        {/* Abas */}
        <div style={{ display: "flex", gap: "var(--space-xs)" }}>
          <button
            type="button"
            onClick={() => setActiveTab("sanitized")}
            style={{
              padding: "var(--space-xs) var(--space-md)",
              fontSize: "var(--font-size-ui-sm)",
              fontWeight: 600,
              color: activeTab === "sanitized" ? "var(--color-blue)" : "var(--color-subtext0)",
              backgroundColor: activeTab === "sanitized" ? "var(--color-base)" : "transparent",
              border: "1px solid",
              borderColor: activeTab === "sanitized" ? "var(--color-surface1)" : "transparent",
              borderBottomColor: activeTab === "sanitized" ? "var(--color-base)" : "transparent",
              borderRadius: "var(--radius-xs) var(--radius-xs) 0 0",
              cursor: "pointer",
            }}
          >
            XML Sanitizado
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("original")}
            style={{
              padding: "var(--space-xs) var(--space-md)",
              fontSize: "var(--font-size-ui-sm)",
              fontWeight: 600,
              color: activeTab === "original" ? "var(--color-text)" : "var(--color-subtext0)",
              backgroundColor: activeTab === "original" ? "var(--color-base)" : "transparent",
              border: "1px solid",
              borderColor: activeTab === "original" ? "var(--color-surface1)" : "transparent",
              borderBottomColor: activeTab === "original" ? "var(--color-base)" : "transparent",
              borderRadius: "var(--radius-xs) var(--radius-xs) 0 0",
              cursor: "pointer",
            }}
          >
            XML Original
          </button>
        </div>

        {/* Ações: Copiar e Baixar */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              padding: "var(--space-xs) var(--space-sm)",
              fontSize: "var(--font-size-ui-xs)",
              fontWeight: 500,
              color: copied ? "var(--color-green)" : "var(--color-text)",
              backgroundColor: "var(--color-surface0)",
              border: `1px solid ${copied ? "var(--color-green)" : "var(--color-surface1)"}`,
              borderRadius: "var(--radius-xs)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copied ? "Copiado!" : `Copiar (${activeTab === "sanitized" ? "Sanitizado" : "Original"})`}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              padding: "var(--space-xs) var(--space-md)",
              fontSize: "var(--font-size-ui-xs)",
              fontWeight: 600,
              color: "var(--color-crust)",
              backgroundColor: "var(--color-blue)",
              border: "1px solid var(--color-blue)",
              borderRadius: "var(--radius-xs)",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Baixar XML Sanitizado
          </button>
        </div>
      </div>

      {/* Área de Visualização com Scroll */}
      <div
        style={{
          position: "relative",
          backgroundColor: "var(--color-base)",
          maxHeight: "480px",
          minHeight: "200px",
          overflow: "auto",
        }}
      >
        <pre
          style={{
            margin: 0,
            padding: "var(--space-md)",
            fontFamily: "var(--font-family-code)",
            fontSize: "var(--font-size-code-md)",
            lineHeight: "var(--line-height-code-md)",
            color: "var(--color-text)",
            whiteSpace: "pre",
            tabSize: 2,
          }}
        >
          <code
            dangerouslySetInnerHTML={{ __html: htmlToRender }}
            data-testid="xml-code-content"
          />
        </pre>
      </div>
    </div>
  );
}
