import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  buildMirroredRows,
} from "@/features/xml-comparator/presentation/mirrored-rows";
import { XmlComparatorView } from "@/features/xml-comparator/presentation/XmlComparatorView";
import { formatXmlToLines, compareXmlTrees, loadComparatorTree } from "@/features/xml-comparator/application";
import type { XmlComparisonDiff } from "@/features/xml-comparator/domain";

// Configurar ambiente React 19 act
// @ts-expect-error global declaration for act
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SAMPLE_APPROVED_SHORT = `<root>
  <A>1</A>
  <B>2</B>
  <C>3</C>
</root>`;

const SAMPLE_REJECTED_INSERTION = `<root>
  <A>1</A>
  <X>99</X>
  <B>2</B>
  <C>3</C>
</root>`;

const SAMPLE_REJECTED_REMOVAL = `<root>
  <A>1</A>
  <C>3</C>
</root>`;

const SAMPLE_REPEATED_ITEMS_APP = `<root>
  <item id="1"><nome>Item 1</nome></item>
  <item id="2"><nome>Item 2</nome></item>
</root>`;

const SAMPLE_REPEATED_ITEMS_REJ = `<root>
  <item id="1"><nome>Item 1</nome></item>
  <item id="2"><nome>Item 2 Modificado</nome></item>
  <item id="3"><nome>Item 3 Novo</nome></item>
</root>`;

const SAMPLE_LONG_TEXT_APP = `<root>
  <id>100</id>
  <xDescServ>Texto curto</xDescServ>
  <cNBS>12345</cNBS>
</root>`;

const SAMPLE_LONG_TEXT_REJ = `<root>
  <id>100</id>
  <xDescServ>Texto extremamente longo que contem diversas descricoes e quebra em multiplas linhas visuais na interface para efeito de comparacao</xDescServ>
  <cNBS>12345</cNBS>
</root>`;

describe("XML Comparator — Mirrored Comparison Engine & Presentation", () => {
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

  async function uploadFile(
    inputTestId: string,
    content: string,
    filename: string,
    mimeType = "application/xml"
  ) {
    const fileInput = container.querySelector(
      `[data-testid="${inputTestId}"]`
    ) as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const file = new File([content], filename, { type: mimeType });

    await act(async () => {
      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: true,
      });
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });
  }

  describe("A. Algoritmo de Alinhamento Estrutural (buildMirroredRows)", () => {
    it("1. XMLs idênticos permanecem 100% alinhados linha a linha", () => {
      const linesA = formatXmlToLines(SAMPLE_APPROVED_SHORT);
      const linesB = formatXmlToLines(SAMPLE_APPROVED_SHORT);
      const diffsByPath = new Map<string, XmlComparisonDiff[]>();

      const rows = buildMirroredRows(linesA, linesB, diffsByPath);

      expect(rows.length).toBe(linesA.length);
      for (let i = 0; i < rows.length; i++) {
        expect(rows[i].approved).not.toBeNull();
        expect(rows[i].rejected).not.toBeNull();
        expect(rows[i].approvedLineNumber).toBe(i + 1);
        expect(rows[i].rejectedLineNumber).toBe(i + 1);
        expect(rows[i].approved?.path).toBe(rows[i].rejected?.path);
      }
    });

    it("2. VALUE_DIFF aparece na mesma row", () => {
      const treeApp = loadComparatorTree(SAMPLE_LONG_TEXT_APP);
      const treeRej = loadComparatorTree(SAMPLE_LONG_TEXT_REJ);
      const result = compareXmlTrees(treeApp, treeRej);

      const linesA = formatXmlToLines(SAMPLE_LONG_TEXT_APP);
      const linesB = formatXmlToLines(SAMPLE_LONG_TEXT_REJ);

      const diffsByPath = new Map<string, XmlComparisonDiff[]>();
      for (const diff of result.diffs) {
        const list = diffsByPath.get(diff.path) ?? [];
        list.push(diff);
        diffsByPath.set(diff.path, list);
      }

      const rows = buildMirroredRows(linesA, linesB, diffsByPath);
      const xDescRow = rows.find((r) => r.path === "/root[1]/xDescServ[1]");

      expect(xDescRow).toBeDefined();
      expect(xDescRow?.approved?.text).toContain("Texto curto");
      expect(xDescRow?.rejected?.text).toContain("Texto extremamente longo");
      expect(xDescRow?.approvedLineNumber).not.toBeNull();
      expect(xDescRow?.rejectedLineNumber).not.toBeNull();
      expect(xDescRow?.diffs.length).toBeGreaterThan(0);
      expect(xDescRow?.diffs[0].kind).toBe("VALUE_DIFF");
    });

    it("3. ONLY_IN_APPROVED cria slot vazio no rejeitado", () => {
      const linesA = formatXmlToLines(SAMPLE_APPROVED_SHORT);
      const linesB = formatXmlToLines(SAMPLE_REJECTED_REMOVAL);
      const diffsByPath = new Map<string, XmlComparisonDiff[]>();

      const rows = buildMirroredRows(linesA, linesB, diffsByPath);
      const bRow = rows.find((r) => r.path === "/root[1]/B[1]");

      expect(bRow).toBeDefined();
      expect(bRow?.approved).not.toBeNull();
      expect(bRow?.rejected).toBeNull();
      expect(bRow?.approvedLineNumber).toBe(3);
      expect(bRow?.rejectedLineNumber).toBeNull();
    });

    it("4. ONLY_IN_REJECTED cria slot vazio no aprovado", () => {
      const linesA = formatXmlToLines(SAMPLE_APPROVED_SHORT);
      const linesB = formatXmlToLines(SAMPLE_REJECTED_INSERTION);
      const diffsByPath = new Map<string, XmlComparisonDiff[]>();

      const rows = buildMirroredRows(linesA, linesB, diffsByPath);
      const xRow = rows.find((r) => r.path === "/root[1]/X[1]");

      expect(xRow).toBeDefined();
      expect(xRow?.approved).toBeNull();
      expect(xRow?.rejected).not.toBeNull();
      expect(xRow?.approvedLineNumber).toBeNull();
      expect(xRow?.rejectedLineNumber).toBe(3);
    });

    it("5. inserção no meio não desloca as linhas seguintes", () => {
      const linesA = formatXmlToLines(SAMPLE_APPROVED_SHORT);
      const linesB = formatXmlToLines(SAMPLE_REJECTED_INSERTION);
      const diffsByPath = new Map<string, XmlComparisonDiff[]>();

      const rows = buildMirroredRows(linesA, linesB, diffsByPath);

      // Row A: <A> | <A>
      const rowA = rows.find((r) => r.path === "/root[1]/A[1]");
      expect(rowA?.approved).not.toBeNull();
      expect(rowA?.rejected).not.toBeNull();

      // Row X: (slot vazio) | <X>
      const rowX = rows.find((r) => r.path === "/root[1]/X[1]");
      expect(rowX?.approved).toBeNull();
      expect(rowX?.rejected).not.toBeNull();

      // Row B: <B> | <B> (permanece alinhado!)
      const rowB = rows.find((r) => r.path === "/root[1]/B[1]");
      expect(rowB?.approved).not.toBeNull();
      expect(rowB?.rejected).not.toBeNull();
      expect(rowB?.approved?.text).toContain("<B>2</B>");
      expect(rowB?.rejected?.text).toContain("<B>2</B>");

      // Row C: <C> | <C> (permanece alinhado!)
      const rowC = rows.find((r) => r.path === "/root[1]/C[1]");
      expect(rowC?.approved).not.toBeNull();
      expect(rowC?.rejected).not.toBeNull();
      expect(rowC?.approved?.text).toContain("<C>3</C>");
      expect(rowC?.rejected?.text).toContain("<C>3</C>");
    });

    it("6. remoção no meio não desloca as linhas seguintes", () => {
      const linesA = formatXmlToLines(SAMPLE_APPROVED_SHORT);
      const linesB = formatXmlToLines(SAMPLE_REJECTED_REMOVAL);
      const diffsByPath = new Map<string, XmlComparisonDiff[]>();

      const rows = buildMirroredRows(linesA, linesB, diffsByPath);

      // Row A: <A> | <A>
      const rowA = rows.find((r) => r.path === "/root[1]/A[1]");
      expect(rowA?.approved).not.toBeNull();
      expect(rowA?.rejected).not.toBeNull();

      // Row B: <B> | (slot vazio)
      const rowB = rows.find((r) => r.path === "/root[1]/B[1]");
      expect(rowB?.approved).not.toBeNull();
      expect(rowB?.rejected).toBeNull();

      // Row C: <C> | <C> (permanece alinhado!)
      const rowC = rows.find((r) => r.path === "/root[1]/C[1]");
      expect(rowC?.approved).not.toBeNull();
      expect(rowC?.rejected).not.toBeNull();
      expect(rowC?.approved?.text).toContain("<C>3</C>");
      expect(rowC?.rejected?.text).toContain("<C>3</C>");
    });

    it("7. elementos repetidos utilizam path posicional corretamente", () => {
      const linesA = formatXmlToLines(SAMPLE_REPEATED_ITEMS_APP);
      const linesB = formatXmlToLines(SAMPLE_REPEATED_ITEMS_REJ);
      const diffsByPath = new Map<string, XmlComparisonDiff[]>();

      const rows = buildMirroredRows(linesA, linesB, diffsByPath);

      // Item 1
      const item1Open = rows.find((r) => r.path === "/root[1]/item[1]" && r.approved?.text.includes("<item"));
      expect(item1Open?.approved).not.toBeNull();
      expect(item1Open?.rejected).not.toBeNull();

      // Item 2
      const item2Open = rows.find((r) => r.path === "/root[1]/item[2]" && r.approved?.text.includes("<item"));
      expect(item2Open?.approved).not.toBeNull();
      expect(item2Open?.rejected).not.toBeNull();

      // Item 3 (Presente apenas no rejeitado)
      const item3Open = rows.find((r) => r.path === "/root[1]/item[3]" && r.rejected?.text.includes("<item"));
      expect(item3Open?.approved).toBeNull();
      expect(item3Open?.rejected).not.toBeNull();
    });

    it("8. múltiplos diffs no mesmo path não são perdidos", () => {
      const linesA = formatXmlToLines(`<root><item attr="A">1</item></root>`);
      const linesB = formatXmlToLines(`<root><item attr="B">2</item></root>`);

      const diff1: XmlComparisonDiff = {
        id: "diff-val-1",
        kind: "VALUE_DIFF",
        path: "/root[1]/item[1]",
        tag: "item",
        approvedValue: "1",
        rejectedValue: "2",
        detail: "Valor divergente",
      };

      const diff2: XmlComparisonDiff = {
        id: "diff-attr-1",
        kind: "ATTRIBUTE_DIFF",
        path: "/root[1]/item[1]",
        tag: "item",
        approvedValue: null,
        rejectedValue: null,
        attributes: [{ name: "attr", approvedValue: "A", rejectedValue: "B" }],
        detail: "Atributo divergente",
      };

      const diffsByPath = new Map<string, XmlComparisonDiff[]>();
      diffsByPath.set("/root[1]/item[1]", [diff1, diff2]);

      const rows = buildMirroredRows(linesA, linesB, diffsByPath);
      const itemRow = rows.find((r) => r.path === "/root[1]/item[1]");

      expect(itemRow).toBeDefined();
      expect(itemRow?.diffs.length).toBe(2);
      expect(itemRow?.diffs.map((d) => d.id)).toEqual(["diff-val-1", "diff-attr-1"]);
    });

    it("9. declaração XML inicial <?xml ... ?> é alinhada na primeira row", () => {
      const xmlA = `<?xml version="1.0" encoding="utf-8"?><root><A>1</A></root>`;
      const xmlB = `<?xml version="1.0" encoding="utf-8"?><root><A>2</A></root>`;

      const linesA = formatXmlToLines(xmlA);
      const linesB = formatXmlToLines(xmlB);
      const diffsByPath = new Map<string, XmlComparisonDiff[]>();

      const rows = buildMirroredRows(linesA, linesB, diffsByPath);

      expect(rows[0].approved?.text).toContain("<?xml");
      expect(rows[0].rejected?.text).toContain("<?xml");
      expect(rows[0].path).toBeNull();
      expect(rows[0].approvedLineNumber).toBe(1);
      expect(rows[0].rejectedLineNumber).toBe(1);
    });
  });

  describe("B. Comportamento Visual Espelhado e Interatividade (UI)", () => {
    it("10. clique no lado aprovado seleciona a row em roxo (mauve) e segundo clique desmarca", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", SAMPLE_APPROVED_SHORT, "app.xml");
      await uploadFile("rejected-file-input", SAMPLE_REJECTED_INSERTION, "rej.xml");

      // Encontrar a linha 2 do XML aprovado (<A>1</A>)
      const approvedLineA = container.querySelector('[data-testid="approved-line-2"]') as HTMLDivElement;
      expect(approvedLineA).not.toBeNull();

      // Primeiro clique: seleciona
      await act(async () => {
        approvedLineA.click();
      });

      // A row inteira deve possuir o destaque selecionado em roxo (mauve)
      const rowEl = container.querySelector('[data-path="/root[1]/A[1]"]') as HTMLDivElement;
      expect(rowEl).not.toBeNull();
      expect(rowEl.style.outline).toContain("var(--color-mauve)");

      // Segundo clique na mesma linha: desmarca (toggle)
      await act(async () => {
        approvedLineA.click();
      });

      // A row volta ao estado não selecionado
      expect(rowEl.style.outline).toBe("none");
    });

    it("11. clique no lado rejeitado seleciona a row em roxo (mauve) e segundo clique desmarca", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", SAMPLE_APPROVED_SHORT, "app.xml");
      await uploadFile("rejected-file-input", SAMPLE_REJECTED_INSERTION, "rej.xml");

      // Encontrar a linha 2 do XML rejeitado (<A>1</A>)
      const rejectedLineA = container.querySelector('[data-testid="rejected-line-2"]') as HTMLDivElement;
      expect(rejectedLineA).not.toBeNull();

      // Primeiro clique: seleciona
      await act(async () => {
        rejectedLineA.click();
      });

      // A row inteira deve possuir o destaque selecionado em roxo (mauve)
      const rowEl = container.querySelector('[data-path="/root[1]/A[1]"]') as HTMLDivElement;
      expect(rowEl).not.toBeNull();
      expect(rowEl.style.outline).toContain("var(--color-mauve)");

      // Segundo clique: desmarca
      await act(async () => {
        rejectedLineA.click();
      });

      expect(rowEl.style.outline).toBe("none");
    });

    it("12. slot vazio também recebe estado selecionado em roxo (mauve) e permite toggle", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", SAMPLE_APPROVED_SHORT, "app.xml");
      await uploadFile("rejected-file-input", SAMPLE_REJECTED_INSERTION, "rej.xml");

      // O elemento <X> está na linha 3 do rejeitado e tem slot vazio no aprovado
      const emptySlot = container.querySelector('[data-testid="approved-empty-slot"]') as HTMLDivElement;
      expect(emptySlot).not.toBeNull();

      const rowX = container.querySelector('[data-path="/root[1]/X[1]"]') as HTMLDivElement;
      expect(rowX).not.toBeNull();

      await act(async () => {
        emptySlot.click();
      });

      // A row inteira e o slot vazio recebem destaque em roxo
      expect(rowX.style.outline).toContain("var(--color-mauve)");

      // Segundo clique no slot vazio: desmarca
      await act(async () => {
        emptySlot.click();
      });

      expect(rowX.style.outline).toBe("none");
    });

    it("13. seleção atualiza o painel inferior imediatamente", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", SAMPLE_LONG_TEXT_APP, "app.xml");
      await uploadFile("rejected-file-input", SAMPLE_LONG_TEXT_REJ, "rej.xml");

      const diffDetails = container.querySelector('[data-testid="comparator-diff-details"]');
      expect(diffDetails).not.toBeNull();
      expect(diffDetails?.textContent).toContain("Caminho Canônico:");
      expect(diffDetails?.textContent).toContain("/root[1]/xDescServ[1]");
      expect(diffDetails?.textContent).toContain("Texto curto");
      expect(diffDetails?.textContent).toContain("Texto extremamente longo");
    });

    it("14. Próxima e Anterior percorrem as divergências e executam scroll", async () => {
      // Mock de scrollIntoView
      const scrollIntoViewMock = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", SAMPLE_REPEATED_ITEMS_APP, "app.xml");
      await uploadFile("rejected-file-input", SAMPLE_REPEATED_ITEMS_REJ, "rej.xml");

      const nextBtn = container.querySelector('[data-testid="nav-next-diff-button"]') as HTMLButtonElement;
      expect(nextBtn).not.toBeNull();

      await act(async () => {
        nextBtn.click();
      });

      expect(scrollIntoViewMock).toHaveBeenCalled();

      const prevBtn = container.querySelector('[data-testid="nav-prev-diff-button"]') as HTMLButtonElement;
      expect(prevBtn).not.toBeNull();

      await act(async () => {
        prevBtn.click();
      });

      expect(scrollIntoViewMock).toHaveBeenCalled();
    });

    it("15. Teste de Fixture Visual: quebra de linha extensa não desloca a próxima row", () => {
      const linesA = formatXmlToLines(SAMPLE_LONG_TEXT_APP);
      const linesB = formatXmlToLines(SAMPLE_LONG_TEXT_REJ);
      const diffsByPath = new Map<string, XmlComparisonDiff[]>();

      const rows = buildMirroredRows(linesA, linesB, diffsByPath);

      // Row 1: <root>
      expect(rows[0].path).toBe("/root[1]");
      // Row 2: <id>100</id>
      expect(rows[1].path).toBe("/root[1]/id[1]");
      // Row 3: <xDescServ>
      expect(rows[2].path).toBe("/root[1]/xDescServ[1]");
      expect(rows[2].approved?.text).toContain("Texto curto");
      expect(rows[2].rejected?.text).toContain("Texto extremamente longo");
      expect(rows[2].approvedLineNumber).toBe(3);
      expect(rows[2].rejectedLineNumber).toBe(3);

      // Row 4: <cNBS>12345</cNBS> (Começa exatamente na mesma linha lógica 4 nos dois lados)
      expect(rows[3].path).toBe("/root[1]/cNBS[1]");
      expect(rows[3].approved?.text).toContain("<cNBS>12345</cNBS>");
      expect(rows[3].rejected?.text).toContain("<cNBS>12345</cNBS>");
      expect(rows[3].approvedLineNumber).toBe(4);
      expect(rows[3].rejectedLineNumber).toBe(4);
    });

    it("16. valores longos no painel de detalhes não estouram horizontalmente", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", SAMPLE_LONG_TEXT_APP, "app.xml");
      await uploadFile("rejected-file-input", SAMPLE_LONG_TEXT_REJ, "rej.xml");

      const rejValueEl = container.querySelector('[data-testid="diff-rejected-value"]') as HTMLDivElement;
      expect(rejValueEl).not.toBeNull();
      expect(rejValueEl.style.whiteSpace).toBe("pre-wrap");
      expect(rejValueEl.style.overflowWrap).toBe("anywhere");
      expect(rejValueEl.style.wordBreak).toBe("break-word");
    });
  });
});
