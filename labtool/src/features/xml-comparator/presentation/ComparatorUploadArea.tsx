"use client";

import React, { useRef, useState } from "react";
import type { LoadedFile } from "../domain";
import { MAX_XML_LENGTH } from "../application";

/**
 * Formata bytes em representação legível (B / KB / MB).
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface SingleDropzoneProps {
  label: string;
  sublabel: string;
  accept: string;
  required?: boolean;
  loadedFile: LoadedFile | null;
  onFileLoaded: (file: LoadedFile) => void;
  onFileRemoved: () => void;
  onError: (msg: string) => void;
  isProcessing?: boolean;
  testIdPrefix: string;
}

function SingleDropzone({
  label,
  sublabel,
  accept,
  required = false,
  loadedFile,
  onFileLoaded,
  onFileRemoved,
  onError,
  isProcessing = false,
  testIdPrefix,
}: SingleDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    // 1. Validação de extensão quando restrito a XML
    if (accept === ".xml" && !file.name.toLowerCase().endsWith(".xml")) {
      onError(`Formato inválido para ${label}. Selecione um arquivo com extensão .xml.`);
      return;
    }

    // 2. Validação defensiva de tamanho (2MB)
    if (file.size > MAX_XML_LENGTH) {
      onError(
        `O arquivo "${file.name}" excede o tamanho máximo permitido de ${formatBytes(MAX_XML_LENGTH)}.`
      );
      return;
    }

    // 3. Leitura local via FileReader
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        if (!text.trim()) {
          onError(`O arquivo "${file.name}" está vazio.`);
          return;
        }
        onFileLoaded({
          name: file.name,
          size: file.size,
          text,
        });
      } else {
        onError(`Falha ao ler o arquivo "${file.name}".`);
      }
    };

    reader.onerror = () => {
      onError(`Erro de leitura do arquivo "${file.name}" no navegador.`);
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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div
      data-testid={`${testIdPrefix}-dropzone-container`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-xs)",
        flex: "1 1 0",
        minWidth: "260px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "var(--font-size-ui-xs)",
            fontWeight: 600,
            color: "var(--color-subtext1)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label} {required && <span style={{ color: "var(--color-red)" }}>*</span>}
        </span>
        {loadedFile && (
          <span
            style={{
              fontSize: "var(--font-size-code-sm)",
              fontFamily: "var(--font-family-code)",
              color: "var(--color-green)",
              backgroundColor: "rgba(166, 227, 161, 0.12)",
              padding: "1px 6px",
              borderRadius: "var(--radius-xs)",
            }}
          >
            Carregado
          </span>
        )}
      </div>

      {loadedFile ? (
        <div
          data-testid={`${testIdPrefix}-file-card`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--space-sm) var(--space-md)",
            backgroundColor: "var(--color-surface0)",
            border: "1px solid var(--color-surface1)",
            borderRadius: "var(--radius-sm)",
            gap: "var(--space-sm)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-family-code)",
                fontSize: "var(--font-size-code-md)",
                color: "var(--color-text)",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={loadedFile.name}
            >
              {loadedFile.name}
            </span>
            <span
              style={{
                fontFamily: "var(--font-family-code)",
                fontSize: "var(--font-size-code-sm)",
                color: "var(--color-subtext0)",
              }}
            >
              {formatBytes(loadedFile.size)}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
            <button
              type="button"
              data-testid={`${testIdPrefix}-replace-button`}
              onClick={() => inputRef.current?.click()}
              disabled={isProcessing}
              style={{
                background: "none",
                border: "1px solid var(--color-surface2)",
                borderRadius: "var(--radius-xs)",
                color: "var(--color-subtext1)",
                padding: "var(--space-2xs) var(--space-xs)",
                fontSize: "var(--font-size-ui-xs)",
                cursor: "pointer",
              }}
            >
              Substituir
            </button>
            <button
              type="button"
              data-testid={`${testIdPrefix}-remove-button`}
              onClick={onFileRemoved}
              disabled={isProcessing}
              aria-label={`Remover ${loadedFile.name}`}
              style={{
                background: "none",
                border: "1px solid rgba(243, 139, 168, 0.4)",
                borderRadius: "var(--radius-xs)",
                color: "var(--color-red)",
                padding: "var(--space-2xs) var(--space-xs)",
                fontSize: "var(--font-size-ui-xs)",
                cursor: "pointer",
              }}
            >
              &times;
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          data-testid={`${testIdPrefix}-dropzone`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-md) var(--space-sm)",
            backgroundColor: isDragOver ? "var(--color-surface1)" : "var(--color-surface0)",
            border: `1px dashed ${isDragOver ? "var(--color-blue)" : "var(--color-surface2)"}`,
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            textAlign: "center",
            gap: "var(--space-2xs)",
            transition: "all 0.15s ease",
            minHeight: "92px",
          }}
        >
          <span style={{ fontSize: "var(--font-size-ui-sm)", color: "var(--color-text)", fontWeight: 500 }}>
            {label}
          </span>
          <span style={{ fontSize: "var(--font-size-ui-2xs)", color: "var(--color-subtext0)" }}>
            {sublabel}
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        data-testid={`${testIdPrefix}-file-input`}
        onChange={handleInputChange}
        style={{ display: "none" }}
        disabled={isProcessing}
      />
    </div>
  );
}

export interface ComparatorUploadAreaProps {
  approvedFile: LoadedFile | null;
  rejectedFile: LoadedFile | null;
  errorFile: LoadedFile | null;
  onApprovedLoaded: (file: LoadedFile) => void;
  onRejectedLoaded: (file: LoadedFile) => void;
  onErrorFileLoaded: (file: LoadedFile) => void;
  onApprovedRemoved: () => void;
  onRejectedRemoved: () => void;
  onErrorFileRemoved: () => void;
  onError: (msg: string) => void;
  isProcessing?: boolean;
}

/**
 * Área de upload com três dropzones modulares para o XML Comparator.
 */
export function ComparatorUploadArea({
  approvedFile,
  rejectedFile,
  errorFile,
  onApprovedLoaded,
  onRejectedLoaded,
  onErrorFileLoaded,
  onApprovedRemoved,
  onRejectedRemoved,
  onErrorFileRemoved,
  onError,
  isProcessing = false,
}: ComparatorUploadAreaProps) {
  return (
    <section
      data-testid="comparator-upload-area"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        padding: "var(--space-md)",
        backgroundColor: "var(--color-mantle)",
        border: "1px solid var(--color-surface0)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-xs)",
        }}
      >
        <span
          style={{
            fontSize: "var(--font-size-ui-sm)",
            fontWeight: 600,
            color: "var(--color-text)",
          }}
        >
          Documentos para Comparação
        </span>
        <span
          style={{
            fontSize: "var(--font-size-ui-2xs)",
            color: "var(--color-subtext0)",
          }}
        >
          Processamento 100% local no navegador (limite 2 MB por arquivo)
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-md)",
        }}
      >
        <SingleDropzone
          label="XML Aprovado"
          sublabel="Arraste ou clique (.xml)"
          accept=".xml"
          required
          loadedFile={approvedFile}
          onFileLoaded={onApprovedLoaded}
          onFileRemoved={onApprovedRemoved}
          onError={onError}
          isProcessing={isProcessing}
          testIdPrefix="approved"
        />

        <SingleDropzone
          label="XML Rejeitado"
          sublabel="Arraste ou clique (.xml)"
          accept=".xml"
          required
          loadedFile={rejectedFile}
          onFileLoaded={onRejectedLoaded}
          onFileRemoved={onRejectedRemoved}
          onError={onError}
          isProcessing={isProcessing}
          testIdPrefix="rejected"
        />

        <SingleDropzone
          label="Retorno de Erro (Opcional)"
          sublabel="XML, JSON ou Texto de retorno"
          accept=".xml,.json,.txt,.log"
          required={false}
          loadedFile={errorFile}
          onFileLoaded={onErrorFileLoaded}
          onFileRemoved={onErrorFileRemoved}
          onError={onError}
          isProcessing={isProcessing}
          testIdPrefix="error-file"
        />
      </div>
    </section>
  );
}
