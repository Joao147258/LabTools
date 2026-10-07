"use client";

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import type { XmlComparisonDiff, XmlComparisonSummary } from "../domain";

export interface ComparatorSummaryProps {
  summary: XmlComparisonSummary;
  diffs: XmlComparisonDiff[];
  selectedDiffId: string | null;
  onSelectDiff: (diffId: string) => void;
  onNavigate?: (direction: "prev" | "next") => void;
}

/**
 * Normaliza a entrada de texto do filtro de tags removendo caracteres XML (<, >, /) e espaços externos.
 */
export function normalizeTagInput(raw: string): string {
  return raw.replace(/[<>/]/g, "").trim();
}

/**
 * Retorna a cor da tag/badge de acordo com o tipo de divergência.
 */
function getDiffKindColor(kind: string): string {
  switch (kind) {
    case "ONLY_IN_APPROVED":
      return "var(--color-green)";
    case "ONLY_IN_REJECTED":
      return "var(--color-red)";
    case "VALUE_DIFF":
      return "var(--color-yellow)";
    case "ATTRIBUTE_DIFF":
      return "var(--color-peach)";
    case "STRUCTURE_DIFF":
      return "var(--color-sapphire)";
    case "CONTEXTUAL_DIFF":
      return "var(--color-sky)";
    default:
      return "var(--color-surface2)";
  }
}

/**
 * Componente de visualização do resumo quantitativo e métricas da comparação estrutural.
 */
export function ComparatorSummary({
  summary,
  diffs,
  selectedDiffId,
  onSelectDiff,
  onNavigate,
}: ComparatorSummaryProps) {
  const currentIndex = selectedDiffId
    ? diffs.findIndex((d) => d.id === selectedDiffId)
    : -1;

  // Estado para filtros de tags
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [slideState, setSlideState] = useState<{ slide: number; prevSelectedDiffId: string | null }>({
    slide: 0,
    prevSelectedDiffId: selectedDiffId,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Derivação de tags únicas presentes nas divergências atuais
  const availableTags = useMemo(() => {
    const seen = new Set<string>();
    const tags: string[] = [];
    for (const d of diffs) {
      if (d.tag) {
        const lower = d.tag.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          tags.push(d.tag);
        }
      }
    }
    return tags;
  }, [diffs]);

  // Sugestões de autocomplete baseadas no texto digitado
  const normalizedInput = normalizeTagInput(inputValue);
  const suggestions = useMemo(() => {
    if (!normalizedInput) return [];
    const lower = normalizedInput.toLowerCase();
    return availableTags.filter(
      (tag) =>
        tag.toLowerCase().includes(lower) &&
        !selectedTags.some((st) => st.toLowerCase() === tag.toLowerCase())
    );
  }, [availableTags, normalizedInput, selectedTags]);

  // Adicionar uma tag ao filtro
  const handleAddTag = useCallback(
    (raw: string) => {
      const cleaned = normalizeTagInput(raw);
      if (!cleaned) return;
      // Preservar preferencialmente a grafia encontrada originalmente nos diffs
      const canonical =
        availableTags.find((t) => t.toLowerCase() === cleaned.toLowerCase()) || cleaned;

      setSelectedTags((prev) => {
        if (prev.some((t) => t.toLowerCase() === canonical.toLowerCase())) {
          return prev;
        }
        return [...prev, canonical];
      });
      setInputValue("");
      setShowSuggestions(false);
    },
    [availableTags]
  );

  // Remover uma tag do filtro
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setSelectedTags((prev) =>
      prev.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase())
    );
  }, []);

  // Limpar todos os filtros de tag
  const handleClearTags = useCallback(() => {
    setSelectedTags([]);
    setInputValue("");
    setShowSuggestions(false);
  }, []);

  // Tratamento de teclado no input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (
        suggestions.length > 0 &&
        normalizedInput.toLowerCase() === suggestions[0].toLowerCase()
      ) {
        handleAddTag(suggestions[0]);
      } else if (normalizedInput) {
        handleAddTag(normalizedInput);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Fechar dropdown de sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Divergências filtradas preservando o índice original para cada card
  const filteredDiffsWithIndex = useMemo(() => {
    return diffs
      .map((diff, originalIndex) => ({ diff, originalIndex }))
      .filter(({ diff }) => {
        if (selectedTags.length === 0) return true;
        return selectedTags.some(
          (st) => st.toLowerCase() === diff.tag.toLowerCase()
        );
      });
  }, [diffs, selectedTags]);

  // Limite de cards por slide (2 fileiras típicas comportam ~16-18 cards em desktop padrão)
  const CARDS_PER_SLIDE = 16;
  const totalSlides = Math.ceil(filteredDiffsWithIndex.length / CARDS_PER_SLIDE) || 1;

  // Padrão canônico do React para derivar estado quando props mudam (sem useRef em render e sem useEffect com setState)
  let currentSlide = slideState.slide;
  if (selectedDiffId !== slideState.prevSelectedDiffId) {
    let target = slideState.slide;
    if (selectedDiffId) {
      const idx = filteredDiffsWithIndex.findIndex((i) => i.diff.id === selectedDiffId);
      if (idx >= 0) {
        target = Math.floor(idx / CARDS_PER_SLIDE);
      }
    }
    currentSlide = target;
    setSlideState({
      slide: target,
      prevSelectedDiffId: selectedDiffId,
    });
  }

  const activeSlide = currentSlide < totalSlides ? currentSlide : 0;

  // Cards do slide atual
  const visibleCards = useMemo(() => {
    if (filteredDiffsWithIndex.length <= CARDS_PER_SLIDE) {
      return filteredDiffsWithIndex;
    }
    const start = activeSlide * CARDS_PER_SLIDE;
    return filteredDiffsWithIndex.slice(start, start + CARDS_PER_SLIDE);
  }, [filteredDiffsWithIndex, activeSlide]);

  if (summary.identical) {
    return (
      <section
        data-testid="comparator-summary-identical"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-md) var(--space-lg)",
          backgroundColor: "rgba(166, 227, 161, 0.12)",
          border: "1px solid var(--color-green)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-green)",
          gap: "var(--space-md)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <span style={{ fontSize: "20px" }}>&#10003;</span>
          <div>
            <strong style={{ fontSize: "var(--font-size-ui-base)" }}>
              Nenhuma divergência encontrada.
            </strong>
            <p
              style={{
                fontSize: "var(--font-size-ui-sm)",
                color: "var(--color-subtext1)",
                margin: 0,
              }}
            >
              Os documentos XML aprovado e rejeitado possuem estrutura, tags, atributos e valores equivalentes.
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: "var(--font-size-code-md)",
            fontFamily: "var(--font-family-code)",
            padding: "var(--space-2xs) var(--space-sm)",
            backgroundColor: "var(--color-surface0)",
            borderRadius: "var(--radius-xs)",
            border: "1px solid var(--color-surface1)",
            color: "var(--color-text)",
          }}
        >
          0 divergências
        </span>
      </section>
    );
  }

  return (
    <section
      data-testid="comparator-summary"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-xs)",
        padding: "var(--space-xs) var(--space-sm)",
        backgroundColor: "rgba(24, 24, 37, 0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--color-surface1)",
        borderRadius: "var(--radius-md)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
      }}
    >
      {/* Linha 1: métricas e navegação */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-xs)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2xs)", flexWrap: "wrap" }}>
          {/* Total */}
          <div
            data-testid="metric-total-diffs"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "1px 6px",
              backgroundColor: "var(--color-surface0)",
              border: "1px solid var(--color-surface1)",
              borderRadius: "var(--radius-xs)",
              fontSize: "var(--font-size-ui-xs)",
              color: "var(--color-text)",
            }}
          >
            <span>Total:</span>
            <strong
              style={{
                fontFamily: "var(--font-family-code)",
                color: "var(--color-blue)",
              }}
            >
              {summary.totalDiffs}
            </strong>
          </div>

          {/* Apenas no Aprovado */}
          {summary.onlyInApproved > 0 && (
            <div
              data-testid="metric-only-in-approved"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "1px 6px",
                backgroundColor: "rgba(166, 227, 161, 0.12)",
                border: "1px solid var(--color-green)",
                borderRadius: "var(--radius-xs)",
                fontSize: "var(--font-size-ui-xs)",
                color: "var(--color-green)",
              }}
            >
              <span>+ Apenas no Aprovado:</span>
              <strong style={{ fontFamily: "var(--font-family-code)" }}>
                {summary.onlyInApproved}
              </strong>
            </div>
          )}

          {/* Apenas no Rejeitado */}
          {summary.onlyInRejected > 0 && (
            <div
              data-testid="metric-only-in-rejected"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "1px 6px",
                backgroundColor: "rgba(243, 139, 168, 0.12)",
                border: "1px solid var(--color-red)",
                borderRadius: "var(--radius-xs)",
                fontSize: "var(--font-size-ui-xs)",
                color: "var(--color-red)",
              }}
            >
              <span>- Apenas no Rejeitado:</span>
              <strong style={{ fontFamily: "var(--font-family-code)" }}>
                {summary.onlyInRejected}
              </strong>
            </div>
          )}

          {/* Divergências de Valor */}
          {summary.valueDiffs > 0 && (
            <div
              data-testid="metric-value-diffs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "1px 6px",
                backgroundColor: "rgba(249, 226, 175, 0.12)",
                border: "1px solid var(--color-yellow)",
                borderRadius: "var(--radius-xs)",
                fontSize: "var(--font-size-ui-xs)",
                color: "var(--color-yellow)",
              }}
            >
              <span>Divergência de Valor:</span>
              <strong style={{ fontFamily: "var(--font-family-code)" }}>
                {summary.valueDiffs}
              </strong>
            </div>
          )}

          {/* Atributos Divergentes */}
          {summary.attributeDiffs > 0 && (
            <div
              data-testid="metric-attribute-diffs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "1px 6px",
                backgroundColor: "rgba(250, 179, 135, 0.12)",
                border: "1px solid var(--color-peach)",
                borderRadius: "var(--radius-xs)",
                fontSize: "var(--font-size-ui-xs)",
                color: "var(--color-peach)",
              }}
            >
              <span>Atributos Divergentes:</span>
              <strong style={{ fontFamily: "var(--font-family-code)" }}>
                {summary.attributeDiffs}
              </strong>
            </div>
          )}

          {/* Estrutural */}
          {summary.structureDiffs > 0 && (
            <div
              data-testid="metric-structure-diffs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "1px 6px",
                backgroundColor: "rgba(116, 199, 236, 0.12)",
                border: "1px solid var(--color-sapphire)",
                borderRadius: "var(--radius-xs)",
                fontSize: "var(--font-size-ui-xs)",
                color: "var(--color-sapphire)",
              }}
            >
              <span>Estrutural:</span>
              <strong style={{ fontFamily: "var(--font-family-code)" }}>
                {summary.structureDiffs}
              </strong>
            </div>
          )}

          {/* Contextuais */}
          {summary.contextualDiffs > 0 && (
            <div
              data-testid="metric-contextual-diffs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "1px 6px",
                backgroundColor: "rgba(137, 220, 235, 0.10)",
                border: "1px solid var(--color-sky)",
                borderRadius: "var(--radius-xs)",
                fontSize: "var(--font-size-ui-xs)",
                color: "var(--color-sky)",
              }}
            >
              <span>Contextuais:</span>
              <strong style={{ fontFamily: "var(--font-family-code)" }}>
                {summary.contextualDiffs}
              </strong>
            </div>
          )}
        </div>

        {/* Controles de Navegação Rápida entre Diffs */}
        {diffs.length > 0 && onNavigate && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2xs)",
            }}
          >
            <span
              style={{
                fontSize: "var(--font-size-ui-xs)",
                fontFamily: "var(--font-family-code)",
                color: "var(--color-subtext1)",
              }}
            >
              {currentIndex >= 0 ? `${currentIndex + 1} de ${diffs.length}` : `0 de ${diffs.length}`}
            </span>
            <button
              type="button"
              data-testid="nav-prev-diff-button"
              onClick={() => onNavigate("prev")}
              disabled={currentIndex <= 0}
              aria-label="Divergência anterior"
              style={{
                padding: "2px 6px",
                fontSize: "var(--font-size-ui-xs)",
                backgroundColor: "var(--color-surface0)",
                border: "1px solid var(--color-surface1)",
                borderRadius: "var(--radius-xs)",
                color: currentIndex <= 0 ? "var(--color-overlay0)" : "var(--color-text)",
                cursor: currentIndex <= 0 ? "not-allowed" : "pointer",
              }}
            >
              &larr; Anterior
            </button>
            <button
              type="button"
              data-testid="nav-next-diff-button"
              onClick={() => onNavigate("next")}
              disabled={currentIndex >= diffs.length - 1}
              aria-label="Próxima divergência"
              style={{
                padding: "2px 6px",
                fontSize: "var(--font-size-ui-xs)",
                backgroundColor: "var(--color-surface0)",
                border: "1px solid var(--color-surface1)",
                borderRadius: "var(--radius-xs)",
                color: currentIndex >= diffs.length - 1 ? "var(--color-overlay0)" : "var(--color-text)",
                cursor: currentIndex >= diffs.length - 1 ? "not-allowed" : "pointer",
              }}
            >
              Próxima &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Área de Filtro de Tags e Lista de Divergências */}
      {diffs.length > 0 && (
        <div
          ref={containerRef}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-xs)",
            borderTop: "1px solid rgba(69, 71, 90, 0.4)",
            paddingTop: "var(--space-2xs)",
          }}
        >
          {/* Linha 2: Tags + Input + Chips de Tags selecionadas */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "var(--space-xs)",
            }}
          >
            <span
              style={{
                fontSize: "var(--font-size-ui-xs)",
                fontWeight: 600,
                color: "var(--color-subtext0)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                flexShrink: 0,
              }}
            >
              Tags
            </span>

            {/* Input com Autocomplete */}
            <div
              style={{
                position: "relative",
                width: "min(100%, 420px)",
                flex: "1 1 240px",
                maxWidth: "500px",
              }}
            >
              <input
                type="text"
                data-testid="tag-filter-input"
                placeholder="Digite uma tag e pressione Enter..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleInputKeyDown}
                style={{
                  width: "100%",
                  padding: "3px 8px",
                  fontSize: "var(--font-size-ui-xs)",
                  fontFamily: "var(--font-family-code)",
                  backgroundColor: "var(--color-base)",
                  border: "1px solid var(--color-surface1)",
                  borderRadius: "var(--radius-xs)",
                  color: "var(--color-text)",
                  outline: "none",
                }}
              />

              {/* Dropdown de Sugestões com Acabamento Acrílico / Glassmorphism */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  data-testid="tag-autocomplete-suggestions"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    backgroundColor: "rgba(24, 24, 37, 0.92)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid var(--color-surface1)",
                    borderRadius: "var(--radius-sm)",
                    boxShadow: "0 12px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)",
                    maxHeight: "200px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    padding: "var(--space-2xs)",
                  }}
                >
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      data-testid={`suggestion-${sug}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAddTag(sug);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "4px 8px",
                        textAlign: "left",
                        backgroundColor: "transparent",
                        border: "none",
                        borderRadius: "var(--radius-xs)",
                        color: "var(--color-text)",
                        fontFamily: "var(--font-family-code)",
                        fontSize: "var(--font-size-code-sm)",
                        cursor: "pointer",
                        transition: "background-color 0.15s ease, color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(137, 180, 250, 0.12)";
                        e.currentTarget.style.color = "var(--color-blue)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--color-text)";
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{sug}</span>
                      <span
                        style={{
                          fontSize: "var(--font-size-ui-2xs)",
                          color: "var(--color-subtext0)",
                          fontFamily: "var(--font-family-ui)",
                        }}
                      >
                        Adicionar &crarr;
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chips de Tags Selecionadas e Botão Limpar na mesma linha */}
            {selectedTags.length > 0 && (
              <div
                data-testid="selected-tags-container"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "var(--space-2xs)",
                }}
              >
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    data-testid={`tag-filter-chip-${tag}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--space-2xs)",
                      padding: "1px 6px",
                      backgroundColor: "var(--color-surface0)",
                      border: "1px solid var(--color-surface1)",
                      borderRadius: "var(--radius-xs)",
                      fontSize: "var(--font-size-ui-xs)",
                      fontFamily: "var(--font-family-code)",
                      color: "var(--color-text)",
                    }}
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      data-testid={`remove-tag-${tag}`}
                      aria-label={`Remover filtro ${tag}`}
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-subtext0)",
                        cursor: "pointer",
                        padding: "0 2px",
                        fontSize: "12px",
                        lineHeight: 1,
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--color-red)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--color-subtext0)";
                      }}
                    >
                      &times;
                    </button>
                  </span>
                ))}

                <button
                  type="button"
                  data-testid="clear-tag-filters"
                  onClick={handleClearTags}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-blue)",
                    fontSize: "var(--font-size-ui-xs)",
                    cursor: "pointer",
                    padding: "1px 4px",
                    textDecoration: "underline",
                  }}
                >
                  Limpar
                </button>
              </div>
            )}
          </div>

            {/* Linha 3: Divergências + cards em slide com flex-wrap */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--space-xs)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2xs)",
                  flexShrink: 0,
                  paddingTop: "2px",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--font-size-ui-xs)",
                    fontWeight: 600,
                    color: "var(--color-subtext0)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Divergências
                </span>

                {/* Controles de Slide quando exceder o limite de 2 fileiras */}
                {totalSlides > 1 && (
                  <div
                    data-testid="diff-cards-slide-controls"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "2px",
                      marginLeft: "var(--space-2xs)",
                    }}
                  >
                    <button
                      type="button"
                      data-testid="prev-slide-button"
                      aria-label="Slide anterior de divergências"
                      disabled={activeSlide <= 0}
                      onClick={() =>
                        setSlideState((prev) => ({
                          ...prev,
                          slide: Math.max(0, activeSlide - 1),
                        }))
                      }
                      style={{
                        padding: "1px 5px",
                        fontSize: "var(--font-size-ui-xs)",
                        lineHeight: 1,
                        backgroundColor: "var(--color-surface0)",
                        border: "1px solid var(--color-surface1)",
                        borderRadius: "var(--radius-xs)",
                        color: activeSlide <= 0 ? "var(--color-overlay0)" : "var(--color-text)",
                        cursor: activeSlide <= 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      &lsaquo;
                    </button>
                    <span
                      data-testid="slide-indicator"
                      style={{
                        fontSize: "11px",
                        fontFamily: "var(--font-family-code)",
                        color: "var(--color-subtext0)",
                        padding: "0 4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {activeSlide + 1}/{totalSlides}
                    </span>
                    <button
                      type="button"
                      data-testid="next-slide-button"
                      aria-label="Próximo slide de divergências"
                      disabled={activeSlide >= totalSlides - 1}
                      onClick={() =>
                        setSlideState((prev) => ({
                          ...prev,
                          slide: Math.min(totalSlides - 1, activeSlide + 1),
                        }))
                      }
                      style={{
                        padding: "1px 5px",
                        fontSize: "var(--font-size-ui-xs)",
                        lineHeight: 1,
                        backgroundColor: "var(--color-surface0)",
                        border: "1px solid var(--color-surface1)",
                        borderRadius: "var(--radius-xs)",
                        color: activeSlide >= totalSlides - 1 ? "var(--color-overlay0)" : "var(--color-text)",
                        cursor: activeSlide >= totalSlides - 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      &rsaquo;
                    </button>
                  </div>
                )}
              </div>

              {/* Cards do slide atual com quebra natural (flex-wrap) */}
              <div
                ref={cardsContainerRef}
                data-testid="comparator-diff-cards"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  flex: 1,
                  gap: "4px",
                  maxHeight: "150px",
                  overflowY: "auto",
                }}
              >
                {visibleCards.length === 0 ? (
                  <span
                    data-testid="no-diffs-matching-tags"
                    style={{
                      fontSize: "var(--font-size-ui-xs)",
                      color: "var(--color-subtext0)",
                      fontStyle: "italic",
                      padding: "var(--space-2xs) 0",
                    }}
                  >
                    Nenhuma divergência encontrada para as tags selecionadas.
                  </span>
                ) : (
                  visibleCards.map(({ diff, originalIndex }) => {
                    const isSelected = diff.id === selectedDiffId;
                    const badgeColor = getDiffKindColor(diff.kind);
                    const formattedIndex = String(originalIndex + 1).padStart(2, "0");

                    return (
                      <button
                        key={diff.id}
                        type="button"
                        data-testid={`jump-diff-${originalIndex}`}
                        onClick={() => onSelectDiff(diff.id)}
                        style={{
                          padding: "3px 8px",
                          fontSize: "var(--font-size-code-sm)",
                          fontFamily: "var(--font-family-code)",
                          borderRadius: "var(--radius-xs)",
                          border: isSelected
                            ? "1px solid var(--color-mauve)"
                            : "1px solid var(--color-surface1)",
                          backgroundColor: isSelected
                            ? "rgba(203, 166, 247, 0.20)"
                            : "var(--color-surface0)",
                          color: isSelected ? "var(--color-mauve)" : "var(--color-text)",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "var(--space-2xs)",
                          transition:
                            "background-color 0.15s ease, border-color 0.15s ease",
                        }}
                      >
                        {/* ● = tipo da divergência */}
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: badgeColor,
                            flexShrink: 0,
                          }}
                        />
                        {/* #01 = índice posicional original discreto */}
                        <span
                          style={{
                            color: isSelected
                              ? "var(--color-mauve)"
                              : "var(--color-subtext0)",
                            fontSize: "11px",
                          }}
                        >
                          #{formattedIndex}
                        </span>
                        {/* Nome da tag em destaque */}
                        <span
                          style={{
                            fontWeight: 600,
                            color: isSelected
                              ? "var(--color-mauve)"
                              : "var(--color-text)",
                          }}
                        >
                          {diff.tag}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </section>
  );
}

