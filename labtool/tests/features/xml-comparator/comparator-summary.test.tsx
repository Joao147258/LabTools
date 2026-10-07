import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  ComparatorSummary,
  normalizeTagInput,
} from "@/features/xml-comparator/presentation/ComparatorSummary";
import type { XmlComparisonDiff, XmlComparisonSummary } from "@/features/xml-comparator/domain";

// @ts-expect-error global declaration for act
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const MOCK_SUMMARY: XmlComparisonSummary = {
  identical: false,
  totalDiffs: 4,
  onlyInApproved: 1,
  onlyInRejected: 1,
  valueDiffs: 1,
  attributeDiffs: 1,
  structureDiffs: 0,
  contextualDiffs: 0,
};

const MOCK_DIFFS: XmlComparisonDiff[] = [
  {
    id: "diff-1",
    kind: "VALUE_DIFF",
    path: "/nfeProc/NFe/infNFe/emit/CEP[1]",
    tag: "CEP",
    approvedValue: "01001000",
    rejectedValue: "02002000",
    detail: "Valor do elemento CEP é divergente",
  },
  {
    id: "diff-2",
    kind: "ONLY_IN_APPROVED",
    path: "/nfeProc/NFe/infNFe/emit/CNPJ[1]",
    tag: "CNPJ",
    approvedValue: "12345678000195",
    rejectedValue: null,
    detail: "Elemento CNPJ existe apenas no arquivo aprovado",
  },
  {
    id: "diff-3",
    kind: "VALUE_DIFF",
    path: "/nfeProc/NFe/infNFe/dest/enderDest/CEP[1]",
    tag: "CEP",
    approvedValue: "04004000",
    rejectedValue: "05005000",
    detail: "Valor do elemento CEP é divergente",
  },
  {
    id: "diff-4",
    kind: "ONLY_IN_REJECTED",
    path: "/nfeProc/NFe/infNFe/dest/xNome[1]",
    tag: "xNome",
    approvedValue: null,
    rejectedValue: "CONSUMIDOR FINAL",
    detail: "Elemento xNome existe apenas no arquivo rejeitado",
  },
];

function typeInInput(input: HTMLInputElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;
  nativeInputValueSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("ComparatorSummary — Tag Filtering & Cards", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  // 1. Sem filtros, todas as divergências aparecem
  it("1. sem filtros, todas as divergências aparecem", async () => {
    const onSelectDiff = vi.fn();
    await act(async () => {
      root.render(
        <ComparatorSummary
          summary={MOCK_SUMMARY}
          diffs={MOCK_DIFFS}
          selectedDiffId="diff-1"
          onSelectDiff={onSelectDiff}
        />
      );
    });

    const cards = container.querySelectorAll('[data-testid^="jump-diff-"]');
    expect(cards.length).toBe(4);
    expect(container.textContent).toContain("CEP");
    expect(container.textContent).toContain("CNPJ");
    expect(container.textContent).toContain("xNome");
  });

  // 2. Adicionar CEP mostra somente divergências cuja tag seja CEP
  it("2. adicionar CEP mostra somente divergências cuja tag seja CEP", async () => {
    const onSelectDiff = vi.fn();
    await act(async () => {
      root.render(
        <ComparatorSummary
          summary={MOCK_SUMMARY}
          diffs={MOCK_DIFFS}
          selectedDiffId="diff-1"
          onSelectDiff={onSelectDiff}
        />
      );
    });

    const input = container.querySelector('[data-testid="tag-filter-input"]') as HTMLInputElement;
    expect(input).not.toBeNull();

    await act(async () => {
      // Simular digitação de CEP e Enter
      typeInInput(input, "CEP");
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });

    const cards = container.querySelectorAll('[data-testid^="jump-diff-"]');
    expect(cards.length).toBe(2);
    cards.forEach((card) => {
      expect(card.textContent).toContain("CEP");
    });
    expect(container.textContent).not.toContain("CNPJ");
    expect(container.textContent).not.toContain("xNome");
  });

  // 3. Adicionar CEP e CNPJ mostra CEP OU CNPJ
  it("3. adicionar CEP e CNPJ mostra CEP OU CNPJ", async () => {
    const onSelectDiff = vi.fn();
    await act(async () => {
      root.render(
        <ComparatorSummary
          summary={MOCK_SUMMARY}
          diffs={MOCK_DIFFS}
          selectedDiffId="diff-1"
          onSelectDiff={onSelectDiff}
        />
      );
    });

    const input = container.querySelector('[data-testid="tag-filter-input"]') as HTMLInputElement;

    await act(async () => {
      typeInInput(input, "CEP");
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });

    await act(async () => {
      typeInInput(input, "CNPJ");
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });

    const cards = container.querySelectorAll('[data-testid^="jump-diff-"]');
    expect(cards.length).toBe(3); // 2 CEPs + 1 CNPJ
    expect(container.textContent).toContain("CEP");
    expect(container.textContent).toContain("CNPJ");
    expect(container.textContent).not.toContain("xNome");
  });

  // 4. Remover CEP mantém os demais filtros
  it("4. remover CEP mantém os demais filtros", async () => {
    const onSelectDiff = vi.fn();
    await act(async () => {
      root.render(
        <ComparatorSummary
          summary={MOCK_SUMMARY}
          diffs={MOCK_DIFFS}
          selectedDiffId="diff-1"
          onSelectDiff={onSelectDiff}
        />
      );
    });

    const input = container.querySelector('[data-testid="tag-filter-input"]') as HTMLInputElement;

    await act(async () => {
      typeInInput(input, "CEP");
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });

    await act(async () => {
      typeInInput(input, "CNPJ");
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });

    const removeCepBtn = container.querySelector('[data-testid="remove-tag-CEP"]') as HTMLButtonElement;
    expect(removeCepBtn).not.toBeNull();

    await act(async () => {
      removeCepBtn.click();
    });

    const cards = container.querySelectorAll('[data-testid^="jump-diff-"]');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain("CNPJ");
  });

  // 5. Limpar restaura todas as divergências
  it("5. Limpar restaura todas as divergências", async () => {
    const onSelectDiff = vi.fn();
    await act(async () => {
      root.render(
        <ComparatorSummary
          summary={MOCK_SUMMARY}
          diffs={MOCK_DIFFS}
          selectedDiffId="diff-1"
          onSelectDiff={onSelectDiff}
        />
      );
    });

    const input = container.querySelector('[data-testid="tag-filter-input"]') as HTMLInputElement;

    await act(async () => {
      typeInInput(input, "CNPJ");
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });

    expect(container.querySelectorAll('[data-testid^="jump-diff-"]').length).toBe(1);

    const clearBtn = container.querySelector('[data-testid="clear-tag-filters"]') as HTMLButtonElement;
    expect(clearBtn).not.toBeNull();

    await act(async () => {
      clearBtn.click();
    });

    expect(container.querySelectorAll('[data-testid^="jump-diff-"]').length).toBe(4);
  });

  // 6. <CEP> é normalizado para CEP
  it("6. <CEP> é normalizado para CEP", async () => {
    expect(normalizeTagInput("<CEP>")).toBe("CEP");
    expect(normalizeTagInput("<CEP/>")).toBe("CEP");
    expect(normalizeTagInput("  cep  ")).toBe("cep");

    const onSelectDiff = vi.fn();
    await act(async () => {
      root.render(
        <ComparatorSummary
          summary={MOCK_SUMMARY}
          diffs={MOCK_DIFFS}
          selectedDiffId="diff-1"
          onSelectDiff={onSelectDiff}
        />
      );
    });

    const input = container.querySelector('[data-testid="tag-filter-input"]') as HTMLInputElement;

    await act(async () => {
      typeInInput(input, "<CEP/>");
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });

    const cards = container.querySelectorAll('[data-testid^="jump-diff-"]');
    expect(cards.length).toBe(2);
    expect(container.querySelector('[data-testid="tag-filter-chip-CEP"]')).not.toBeNull();
  });

  // 7. Comparação das tags é case-insensitive
  it("7. comparação das tags é case-insensitive", async () => {
    const onSelectDiff = vi.fn();
    await act(async () => {
      root.render(
        <ComparatorSummary
          summary={MOCK_SUMMARY}
          diffs={MOCK_DIFFS}
          selectedDiffId="diff-1"
          onSelectDiff={onSelectDiff}
        />
      );
    });

    const input = container.querySelector('[data-testid="tag-filter-input"]') as HTMLInputElement;

    await act(async () => {
      typeInInput(input, "xnome");
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });

    const cards = container.querySelectorAll('[data-testid^="jump-diff-"]');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain("xNome");
  });

  // 8. Clicar em um card continua chamando onSelectDiff
  it("8. clicar em um card continua chamando onSelectDiff com o diff.id correto", async () => {
    const onSelectDiff = vi.fn();
    await act(async () => {
      root.render(
        <ComparatorSummary
          summary={MOCK_SUMMARY}
          diffs={MOCK_DIFFS}
          selectedDiffId="diff-1"
          onSelectDiff={onSelectDiff}
        />
      );
    });

    const card2 = container.querySelector('[data-testid="jump-diff-1"]') as HTMLButtonElement;
    expect(card2).not.toBeNull();

    await act(async () => {
      card2.click();
    });

    expect(onSelectDiff).toHaveBeenCalledWith("diff-2");
  });

  // 9. selectedDiffId continua gerando o destaque visual esperado
  it("9. selectedDiffId continua gerando o destaque visual esperado (borda/fundo)", async () => {
    const onSelectDiff = vi.fn();
    await act(async () => {
      root.render(
        <ComparatorSummary
          summary={MOCK_SUMMARY}
          diffs={MOCK_DIFFS}
          selectedDiffId="diff-2"
          onSelectDiff={onSelectDiff}
        />
      );
    });

    const card1 = container.querySelector('[data-testid="jump-diff-0"]') as HTMLButtonElement;
    const card2 = container.querySelector('[data-testid="jump-diff-1"]') as HTMLButtonElement;

    expect(card2.style.border).toContain("var(--color-mauve)");
    expect(card1.style.border).not.toContain("var(--color-mauve)");
  });

  // 10. Ausência de filtros preserva o comportamento anterior
  it("10. ausência de filtros preserva o comportamento anterior e exibe índices formatados", async () => {
    const onSelectDiff = vi.fn();
    await act(async () => {
      root.render(
        <ComparatorSummary
          summary={MOCK_SUMMARY}
          diffs={MOCK_DIFFS}
          selectedDiffId="diff-1"
          onSelectDiff={onSelectDiff}
        />
      );
    });

    // Índices devem ter padding com 2 dígitos (#01, #02, #03, #04)
    expect(container.textContent).toContain("#01");
    expect(container.textContent).toContain("#02");
    expect(container.textContent).toContain("#03");
    expect(container.textContent).toContain("#04");
  });

  // 11. Cards podem quebrar linha com flex-wrap
  it("11. cards utilizam container com flex-wrap para quebra natural de linha", async () => {
    const onSelectDiff = vi.fn();
    await act(async () => {
      root.render(
        <ComparatorSummary
          summary={MOCK_SUMMARY}
          diffs={MOCK_DIFFS}
          selectedDiffId="diff-1"
          onSelectDiff={onSelectDiff}
        />
      );
    });

    const cardsContainer = container.querySelector('[data-testid="comparator-diff-cards"]') as HTMLDivElement;
    expect(cardsContainer).not.toBeNull();
    expect(cardsContainer.style.display).toBe("flex");
    expect(cardsContainer.style.flexWrap).toBe("wrap");
  });

  // 12. Mensagem discreta quando nenhum resultado corresponder às tags selecionadas
  it("12. exibe mensagem discreta quando nenhuma divergência corresponder às tags", async () => {
    const onSelectDiff = vi.fn();
    await act(async () => {
      root.render(
        <ComparatorSummary
          summary={MOCK_SUMMARY}
          diffs={MOCK_DIFFS}
          selectedDiffId="diff-1"
          onSelectDiff={onSelectDiff}
        />
      );
    });

    const input = container.querySelector('[data-testid="tag-filter-input"]') as HTMLInputElement;

    await act(async () => {
      typeInInput(input, "TAG_INEXISTENTE");
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });

    const emptyMsg = container.querySelector('[data-testid="no-diffs-matching-tags"]');
    expect(emptyMsg).not.toBeNull();
    expect(emptyMsg?.textContent).toContain("Nenhuma divergência encontrada para as tags selecionadas.");
  });

  // 13. Autocomplete simples
  it("13. autocomplete apresenta sugestões e permite seleção por clique", async () => {
    const onSelectDiff = vi.fn();
    await act(async () => {
      root.render(
        <ComparatorSummary
          summary={MOCK_SUMMARY}
          diffs={MOCK_DIFFS}
          selectedDiffId="diff-1"
          onSelectDiff={onSelectDiff}
        />
      );
    });

    const input = container.querySelector('[data-testid="tag-filter-input"]') as HTMLInputElement;

    await act(async () => {
      typeInInput(input, "c");
      input.dispatchEvent(new Event("focus", { bubbles: true }));
    });

    const suggestionCep = container.querySelector('[data-testid="suggestion-CEP"]') as HTMLButtonElement;
    expect(suggestionCep).not.toBeNull();

    await act(async () => {
      suggestionCep.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="tag-filter-chip-CEP"]')).not.toBeNull();
  });

  // 14. Fixação sticky e estilo acrílico
  it("14. renderiza painel com position sticky, top 0 e acabamento acrílico", async () => {
    const onSelectDiff = vi.fn();
    await act(async () => {
      root.render(
        <ComparatorSummary
          summary={MOCK_SUMMARY}
          diffs={MOCK_DIFFS}
          selectedDiffId="diff-1"
          onSelectDiff={onSelectDiff}
        />
      );
    });

    const summarySection = container.querySelector('[data-testid="comparator-summary"]') as HTMLElement;
    expect(summarySection).not.toBeNull();
    expect(summarySection.style.position).toBe("sticky");
    expect(summarySection.style.top).toBe("0px");
    expect(summarySection.style.zIndex).toBe("20");
    expect(summarySection.style.backdropFilter).toContain("blur(12px)");

    const diffCardsContainer = container.querySelector('[data-testid="comparator-diff-cards"]') as HTMLElement;
    expect(diffCardsContainer).not.toBeNull();
    expect(diffCardsContainer.style.maxHeight).toBe("150px");
    expect(diffCardsContainer.style.overflowY).toBe("auto");
  });

  // 15. Não exibe controles de slides quando os cards cabem em um único slide
  it("15. não exibe controles de slides quando há poucas divergências", async () => {
    const onSelectDiff = vi.fn();
    await act(async () => {
      root.render(
        <ComparatorSummary
          summary={MOCK_SUMMARY}
          diffs={MOCK_DIFFS} // 4 diffs <= CARDS_PER_SLIDE (16)
          selectedDiffId="diff-1"
          onSelectDiff={onSelectDiff}
        />
      );
    });

    const slideControls = container.querySelector('[data-testid="diff-cards-slide-controls"]');
    expect(slideControls).toBeNull();
  });

  // 16. Exibe slides e navegação quando houver mais cards do que o limite de um slide
  it("16. exibe controles de slides e navega entre páginas quando houver mais divergências", async () => {
    const manyDiffs: XmlComparisonDiff[] = Array.from({ length: 35 }, (_, i) => ({
      id: `diff-many-${i}`,
      kind: "VALUE_DIFF",
      path: `/root/item[${i}]`,
      tag: `tag${i}`,
      approvedValue: `app-${i}`,
      rejectedValue: `rej-${i}`,
      detail: `Divergência no item ${i}`,
    }));

    const onSelectDiff = vi.fn();
    await act(async () => {
      root.render(
        <ComparatorSummary
          summary={{ ...MOCK_SUMMARY, totalDiffs: 35 }}
          diffs={manyDiffs}
          selectedDiffId="diff-many-0"
          onSelectDiff={onSelectDiff}
        />
      );
    });

    const slideControls = container.querySelector('[data-testid="diff-cards-slide-controls"]');
    expect(slideControls).not.toBeNull();

    const indicator = container.querySelector('[data-testid="slide-indicator"]');
    expect(indicator?.textContent).toBe("1/3"); // 35 / 16 = 3 slides

    // Primeiro slide deve ter 16 cards visíveis
    let visibleCards = container.querySelectorAll('[data-testid^="jump-diff-"]');
    expect(visibleCards.length).toBe(16);

    const nextBtn = container.querySelector('[data-testid="next-slide-button"]') as HTMLButtonElement;
    expect(nextBtn).not.toBeNull();

    // Navegar para o slide 2
    await act(async () => {
      nextBtn.click();
    });

    expect(indicator?.textContent).toBe("2/3");
    visibleCards = container.querySelectorAll('[data-testid^="jump-diff-"]');
    expect(visibleCards.length).toBe(16);

    // Navegar para o slide 3
    await act(async () => {
      nextBtn.click();
    });

    expect(indicator?.textContent).toBe("3/3");
    visibleCards = container.querySelectorAll('[data-testid^="jump-diff-"]');
    expect(visibleCards.length).toBe(3); // 35 - 32 = 3 restantes
  });
});
