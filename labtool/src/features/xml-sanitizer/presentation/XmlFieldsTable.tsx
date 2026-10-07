import React, { useMemo, useState } from "react";
import type { FieldCategory, XmlField } from "../domain/sanitization.types";

interface XmlFieldsTableProps {
  fields: XmlField[];
  onToggleField: (fieldId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onRestoreDefaults: () => void;
}

/**
 * Cores semânticas para as categorias fiscais de campos.
 */
function getCategoryBadgeStyle(category: FieldCategory): { bg: string; color: string; border: string } {
  switch (category) {
    case "CPF":
    case "CNPJ":
    case "DOCUMENTO":
      return { bg: "rgba(137, 180, 250, 0.15)", color: "var(--color-blue)", border: "rgba(137, 180, 250, 0.3)" };
    case "CREDENCIAIS":
    case "ASSINATURA":
      return { bg: "rgba(243, 139, 168, 0.15)", color: "var(--color-red)", border: "rgba(243, 139, 168, 0.3)" };
    case "NOME":
    case "RAZAO_SOCIAL":
      return { bg: "rgba(250, 179, 135, 0.15)", color: "var(--color-peach)", border: "rgba(250, 179, 135, 0.3)" };
    case "CONTATO":
    case "ENDERECO":
    case "INSCRICAO":
      return { bg: "rgba(249, 226, 175, 0.15)", color: "var(--color-yellow)", border: "rgba(249, 226, 175, 0.3)" };
    case "TEXTO_LIVRE":
      return { bg: "rgba(116, 199, 236, 0.15)", color: "var(--color-sapphire)", border: "rgba(116, 199, 236, 0.3)" };
    case "IDENTIFICADOR_DPS":
      return { bg: "rgba(137, 220, 235, 0.15)", color: "var(--color-sky)", border: "rgba(137, 220, 235, 0.3)" };
    default:
      return { bg: "var(--color-surface1)", color: "var(--color-subtext0)", border: "var(--color-surface2)" };
  }
}

/**
 * Tabela / Lista interativa de campos inspecionados para seleção e revisão de sanitização.
 */
export function XmlFieldsTable({
  fields,
  onToggleField,
  onSelectAll,
  onDeselectAll,
  onRestoreDefaults,
}: XmlFieldsTableProps) {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Obter categorias únicas presentes nos campos inspecionados
  const availableCategories = useMemo(() => {
    const set = new Set<FieldCategory>();
    fields.forEach((f) => {
      if (!f.hasElementChildren) {
        set.add(f.category);
      }
    });
    return Array.from(set);
  }, [fields]);

  // Filtragem
  const filteredFields = useMemo(() => {
    return fields.filter((field) => {
      const matchesCategory =
        selectedCategoryFilter === "ALL" || field.category === selectedCategoryFilter;
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        field.tag.toLowerCase().includes(term) ||
        field.path.toLowerCase().includes(term) ||
        field.category.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [fields, selectedCategoryFilter, searchTerm]);

  const selectedCount = fields.filter((f) => f.selected && (!f.hasElementChildren || f.category === "ASSINATURA")).length;
  const eligibleCount = fields.filter((f) => !f.hasElementChildren || f.category === "ASSINATURA").length;

  return (
    <div
      data-testid="xml-fields-table"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        backgroundColor: "var(--color-surface0)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-surface1)",
        padding: "var(--space-md)",
      }}
    >
      {/* Barra de Controles e Ações em Lote */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-sm)",
          borderBottom: "1px solid var(--color-surface1)",
          paddingBottom: "var(--space-md)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <h2
            style={{
              fontSize: "var(--font-size-ui-base)",
              fontWeight: 600,
              color: "var(--color-text)",
            }}
          >
            Campos Inspecionados
          </h2>
          <span
            style={{
              fontSize: "var(--font-size-ui-xs)",
              backgroundColor: "var(--color-base)",
              padding: "var(--space-2xs) var(--space-xs)",
              borderRadius: "var(--radius-xs)",
              color: "var(--color-subtext1)",
              fontFamily: "var(--font-family-code)",
              border: "1px solid var(--color-surface1)",
            }}
          >
            {selectedCount} de {eligibleCount} selecionados
          </span>
        </div>

        {/* Botões de Ação em Lote */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)" }}>
          <button
            type="button"
            onClick={onSelectAll}
            style={{
              padding: "var(--space-xs) var(--space-sm)",
              fontSize: "var(--font-size-ui-xs)",
              fontWeight: 500,
              color: "var(--color-text)",
              backgroundColor: "var(--color-surface1)",
              border: "1px solid var(--color-surface2)",
              borderRadius: "var(--radius-xs)",
              cursor: "pointer",
            }}
          >
            Selecionar todos
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            style={{
              padding: "var(--space-xs) var(--space-sm)",
              fontSize: "var(--font-size-ui-xs)",
              fontWeight: 500,
              color: "var(--color-subtext1)",
              backgroundColor: "var(--color-base)",
              border: "1px solid var(--color-surface1)",
              borderRadius: "var(--radius-xs)",
              cursor: "pointer",
            }}
          >
            Desmarcar todos
          </button>
          <button
            type="button"
            onClick={onRestoreDefaults}
            style={{
              padding: "var(--space-xs) var(--space-sm)",
              fontSize: "var(--font-size-ui-xs)",
              fontWeight: 500,
              color: "var(--color-blue)",
              backgroundColor: "var(--color-base)",
              border: "1px solid var(--color-surface1)",
              borderRadius: "var(--radius-xs)",
              cursor: "pointer",
            }}
          >
            Restaurar padrões
          </button>
        </div>
      </div>

      {/* Filtro por Categoria e Busca */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-sm)",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Buscar tag ou caminho..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: "1 1 200px",
            padding: "var(--space-xs) var(--space-sm)",
            backgroundColor: "var(--color-base)",
            border: "1px solid var(--color-surface1)",
            borderRadius: "var(--radius-xs)",
            color: "var(--color-text)",
            fontSize: "var(--font-size-ui-sm)",
            fontFamily: "var(--font-family-code)",
            outline: "none",
          }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2xs)" }}>
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter("ALL")}
            style={{
              padding: "var(--space-2xs) var(--space-xs)",
              fontSize: "var(--font-size-ui-xs)",
              borderRadius: "var(--radius-xs)",
              backgroundColor: selectedCategoryFilter === "ALL" ? "var(--color-blue)" : "var(--color-base)",
              color: selectedCategoryFilter === "ALL" ? "var(--color-crust)" : "var(--color-subtext1)",
              border: "1px solid var(--color-surface1)",
              cursor: "pointer",
              fontWeight: selectedCategoryFilter === "ALL" ? 600 : 400,
            }}
          >
            Todas ({fields.length})
          </button>
          {availableCategories.map((cat) => {
            const count = fields.filter((f) => f.category === cat && !f.hasElementChildren).length;
            const isSelected = selectedCategoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat)}
                style={{
                  padding: "var(--space-2xs) var(--space-xs)",
                  fontSize: "var(--font-size-ui-xs)",
                  borderRadius: "var(--radius-xs)",
                  backgroundColor: isSelected ? "var(--color-blue)" : "var(--color-base)",
                  color: isSelected ? "var(--color-crust)" : "var(--color-subtext1)",
                  border: "1px solid var(--color-surface1)",
                  cursor: "pointer",
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Campos com Scroll Contido */}
      <div
        style={{
          maxHeight: "360px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2xs)",
          border: "1px solid var(--color-surface1)",
          borderRadius: "var(--radius-xs)",
          backgroundColor: "var(--color-base)",
          padding: "var(--space-xs)",
        }}
      >
        {filteredFields.length === 0 ? (
          <div
            style={{
              padding: "var(--space-lg)",
              textAlign: "center",
              color: "var(--color-subtext0)",
              fontSize: "var(--font-size-ui-sm)",
            }}
          >
            Nenhum campo corresponde ao filtro selecionado.
          </div>
        ) : (
          filteredFields.map((field) => {
            const isStructural = field.hasElementChildren && field.category !== "ASSINATURA";
            const badgeStyle = getCategoryBadgeStyle(field.category);

            return (
              <div
                key={field.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--space-sm)",
                  padding: "var(--space-xs) var(--space-sm)",
                  borderRadius: "var(--radius-2xs)",
                  backgroundColor: field.selected ? "rgba(49, 50, 68, 0.6)" : "transparent",
                  borderLeft: field.selected ? "3px solid var(--color-blue)" : "3px solid transparent",
                  opacity: isStructural ? 0.65 : 1,
                  transition: "background-color 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", minWidth: 0 }}>
                  {!isStructural ? (
                    <input
                      type="checkbox"
                      checked={field.selected}
                      onChange={() => onToggleField(field.id)}
                      id={`check-${field.id}`}
                      style={{
                        cursor: "pointer",
                        accentColor: "var(--color-blue)",
                        width: "16px",
                        height: "16px",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        display: "inline-block",
                        width: "16px",
                        textAlign: "center",
                        color: "var(--color-overlay0)",
                        fontSize: "12px",
                      }}
                    >
                      &bull;
                    </span>
                  )}

                  <label
                    htmlFor={!isStructural ? `check-${field.id}` : undefined}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      cursor: !isStructural ? "pointer" : "default",
                      minWidth: 0,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                      <span
                        style={{
                          fontSize: "var(--font-size-code-md)",
                          fontFamily: "var(--font-family-code)",
                          fontWeight: 600,
                          color: isStructural ? "var(--color-subtext1)" : "var(--color-text)",
                        }}
                      >
                        {field.tag}
                      </span>
                      {field.kind === "attribute" && (
                        <span
                          style={{
                            fontSize: "var(--font-size-ui-2xs)",
                            color: "var(--color-subtext0)",
                            fontFamily: "var(--font-family-code)",
                          }}
                        >
                          [atributo]
                        </span>
                      )}
                      {field.kind === "comment" && (
                        <span
                          style={{
                            fontSize: "var(--font-size-ui-2xs)",
                            color: "var(--color-subtext0)",
                            fontFamily: "var(--font-family-code)",
                          }}
                        >
                          [comentário]
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "var(--font-size-code-sm)",
                        fontFamily: "var(--font-family-code)",
                        color: "var(--color-overlay0)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={field.path}
                    >
                      {field.path}
                    </span>
                  </label>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: "var(--font-size-label-sm)",
                      fontFamily: "var(--font-family-code)",
                      padding: "var(--space-2xs) var(--space-xs)",
                      borderRadius: "var(--radius-xs)",
                      backgroundColor: badgeStyle.bg,
                      color: badgeStyle.color,
                      border: `1px solid ${badgeStyle.border}`,
                      fontWeight: 600,
                    }}
                  >
                    {field.category}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--font-size-ui-2xs)",
                      fontFamily: "var(--font-family-code)",
                      color: "var(--color-subtext0)",
                      padding: "var(--space-2xs) var(--space-xs)",
                    }}
                  >
                    {field.action}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
