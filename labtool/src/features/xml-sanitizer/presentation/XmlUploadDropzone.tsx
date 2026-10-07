import React, { useRef, useState } from "react";
import { MAX_XML_SIZE_BYTES } from "../application";

interface XmlUploadDropzoneProps {
  onFileLoaded: (xmlContent: string, fileName: string, fileSizeBytes: number) => void;
  onError: (errorMessage: string) => void;
  isProcessing?: boolean;
}

/**
 * Formata bytes em representação legível (KB / MB).
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Componente de Dropzone e seleção de arquivos XML.
 * Valida formato (.xml), tamanho defensivo (<= 20MB) e lê o conteúdo localmente via File API.
 */
export function XmlUploadDropzone({
  onFileLoaded,
  onError,
  isProcessing = false,
}: XmlUploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    // 1. Validação de extensão
    if (!file.name.toLowerCase().endsWith(".xml")) {
      onError("Formato de arquivo inválido. Selecione um arquivo com extensão .xml.");
      return;
    }

    // 2. Validação de tamanho
    if (file.size > MAX_XML_SIZE_BYTES) {
      onError(`O arquivo excede o limite máximo permitido de ${formatBytes(MAX_XML_SIZE_BYTES)} (20 MB).`);
      return;
    }

    // 3. Leitura local via FileReader / File API
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        onFileLoaded(content, file.name, file.size);
      } else {
        onError("Falha ao ler o conteúdo do arquivo.");
      }
    };
    reader.onerror = () => {
      onError("Erro de leitura do arquivo no navegador.");
    };

    reader.readAsText(file, "UTF-8");
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleContainerClick = () => {
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === "Enter" || e.key === " ") && !isProcessing) {
      e.preventDefault();
      handleContainerClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Área de upload de arquivo XML. Arraste e solte o arquivo aqui ou clique para selecionar."
      onClick={handleContainerClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-3xl) var(--space-xl)",
        borderRadius: "var(--radius-lg)",
        border: `2px dashed ${isDragOver ? "var(--color-blue)" : "var(--color-surface2)"}`,
        backgroundColor: isDragOver ? "var(--color-surface1)" : "var(--color-surface0)",
        cursor: isProcessing ? "wait" : "pointer",
        transition: "all 0.15s ease",
        outline: "none",
        minHeight: "240px",
        textAlign: "center",
        gap: "var(--space-md)",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,text/xml,application/xml"
        onChange={handleFileInputChange}
        style={{ display: "none" }}
        disabled={isProcessing}
        data-testid="xml-file-input"
      />

      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--color-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isDragOver ? "var(--color-blue)" : "var(--color-subtext1)",
          border: "1px solid var(--color-surface1)",
          fontSize: "24px",
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
        <p
          style={{
            fontSize: "var(--font-size-ui-base)",
            fontWeight: 600,
            color: "var(--color-text)",
          }}
        >
          {isProcessing ? "Processando e inspecionando XML..." : "Arraste e solte o arquivo XML aqui ou clique para selecionar"}
        </p>
        <p
          style={{
            fontSize: "var(--font-size-ui-sm)",
            color: "var(--color-subtext0)",
            fontFamily: "var(--font-family-ui)",
          }}
        >
          Formatos suportados: <strong style={{ color: "var(--color-text)", fontFamily: "var(--font-family-code)" }}>.xml</strong> (NF-e, NFC-e, NFS-e, CT-e, MDF-e) &bull; Máximo:{" "}
          <strong style={{ color: "var(--color-text)" }}>20 MB</strong>
        </p>
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-xs)",
          padding: "var(--space-2xs) var(--space-sm)",
          borderRadius: "var(--radius-xs)",
          backgroundColor: "var(--color-base)",
          border: "1px solid var(--color-surface1)",
          fontSize: "var(--font-size-ui-xs)",
          color: "var(--color-subtext1)",
        }}
      >
        <span style={{ color: "var(--color-green)", fontSize: "10px" }}>&#9679;</span>
        Processamento 100% local no navegador &bull; Nenhum dado trafega na rede
      </div>
    </div>
  );
}
