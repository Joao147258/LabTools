import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { XmlComparatorView } from "@/features/xml-comparator/presentation/XmlComparatorView";
import { formatBytes } from "@/features/xml-comparator/presentation/ComparatorUploadArea";

// Configurar ambiente React 19 act
// @ts-expect-error global declaration for act
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SAMPLE_APPROVED_XML = `<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe35230912345678000195550010000001231234567890" versao="4.00">
      <emit>
        <CNPJ>12345678000195</CNPJ>
        <xNome>EMPRESA MODELO LTDA</xNome>
        <enderEmit>
          <xLgr>RUA DAS FLORES</xLgr>
          <nro>100</nro>
          <CEP>01001000</CEP>
        </enderEmit>
      </emit>
      <dest>
        <CPF>12345678900</CPF>
        <xNome>JOAO DA SILVA</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>PROD001</cProd>
          <xProd>PRODUTO TESTE APROVADO</xProd>
          <vProd>150.00</vProd>
        </prod>
      </det>
    </infNFe>
  </NFe>
</nfeProc>`;

const SAMPLE_REJECTED_XML = `<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe35230912345678000195550010000001231234567890" versao="3.10">
      <emit>
        <CNPJ>12345678000195</CNPJ>
        <xNome>EMPRESA MODELO LTDA</xNome>
        <enderEmit>
          <xLgr>RUA DAS FLORES</xLgr>
          <nro>100</nro>
          <CEP>01001000</CEP>
        </enderEmit>
      </emit>
      <dest>
        <CPF>12345678900</CPF>
        <xNome>JOAO DA SILVA</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>PROD001</cProd>
          <xProd>PRODUTO TESTE REJEITADO</xProd>
          <vProd>100.00</vProd>
        </prod>
      </det>
      <infAdic>
        <infCpl>Observacao exclusiva do rejeitado</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
</nfeProc>`;

const SAMPLE_IDENTICAL_XML = `<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe123">
      <emit>
        <CNPJ>12345678000195</CNPJ>
      </emit>
    </infNFe>
  </NFe>
</nfeProc>`;

const SAMPLE_ERROR_JSON = `{
  "cStat": "204",
  "xMotivo": "Rejeicao: Duplicidade de NF-e [chNFe: 35230912345678000195550010000001231234567890]"
}`;

describe("XML Comparator — Presentation Layer", () => {
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

  // Função auxiliar para carregar arquivos via input[type="file"]
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

    // Aguarda o FileReader completar a leitura
    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });
  }

  describe("1. Estado Inicial e Uploads", () => {
    it("deve renderizar a tela inicial com as três dropzones e cabeçalho", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      expect(container.textContent).toContain("XML Comparator");
      expect(container.textContent).toContain("Comparação estrutural profunda e visualização side-by-side");
      expect(container.textContent).toContain("Processamento 100% local no navegador");
      expect(container.textContent).toContain("XML Aprovado");
      expect(container.textContent).toContain("XML Rejeitado");
      expect(container.textContent).toContain("Retorno de Erro (Opcional)");

      expect(container.querySelector('[data-testid="approved-dropzone"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="rejected-dropzone"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="error-file-dropzone"]')).not.toBeNull();
    });

    it("deve formatar bytes corretamente através do utilitário formatBytes", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1048576)).toBe("1 MB");
      expect(formatBytes(524288)).toBe("512 KB");
    });

    it("deve rejeitar arquivo com extensão inválida para XML Aprovado", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", "dummy pdf data", "arquivo.pdf", "application/pdf");

      expect(container.textContent).toContain("Formato inválido para XML Aprovado");
    });

    it("deve rejeitar arquivo com conteúdo vazio", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", "   ", "vazio.xml");

      expect(container.textContent).toContain('O arquivo "vazio.xml" está vazio.');
    });

    it("deve carregar XML aprovado e exibir card com nome e tamanho", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", SAMPLE_APPROVED_XML, "nfe-aprovada.xml");

      expect(container.textContent).toContain("nfe-aprovada.xml");
      expect(container.querySelector('[data-testid="approved-file-card"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="approved-replace-button"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="approved-remove-button"]')).not.toBeNull();
    });

    it("deve carregar arquivo de erro opcional (JSON)", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("error-file-file-input", SAMPLE_ERROR_JSON, "retorno-erro.json", "application/json");

      expect(container.textContent).toContain("retorno-erro.json");
      expect(container.querySelector('[data-testid="error-file-file-card"]')).not.toBeNull();
    });

    it("deve remover arquivo ao clicar no botão de remoção", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", SAMPLE_APPROVED_XML, "nfe-aprovada.xml");
      expect(container.textContent).toContain("nfe-aprovada.xml");

      const removeBtn = container.querySelector('[data-testid="approved-remove-button"]') as HTMLButtonElement;
      await act(async () => {
        removeBtn.click();
      });

      expect(container.textContent).not.toContain("nfe-aprovada.xml");
      expect(container.querySelector('[data-testid="approved-dropzone"]')).not.toBeNull();
    });
  });

  describe("2. Execução da Comparação e Visualização Side-by-Side", () => {
    it("deve executar comparação automaticamente quando ambos os XMLs forem carregados", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", SAMPLE_APPROVED_XML, "aprovado.xml");
      await uploadFile("rejected-file-input", SAMPLE_REJECTED_XML, "rejeitado.xml");

      // Deve renderizar os painéis XML com contagens de elementos e linhas
      expect(container.querySelector('[data-testid="comparator-panels-container"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="comparator-approved-panel"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="comparator-rejected-panel"]')).not.toBeNull();

      expect(container.querySelector('[data-testid="approved-element-count"]')?.textContent).toContain("18 elementos");
      expect(container.querySelector('[data-testid="rejected-element-count"]')?.textContent).toContain("20 elementos");

      // Deve renderizar o resumo de métricas
      expect(container.querySelector('[data-testid="comparator-summary"]')).not.toBeNull();
      expect(container.textContent).toContain("Total:");

      // Deve renderizar detalhes da primeira divergência selecionada
      expect(container.querySelector('[data-testid="comparator-diff-details"]')).not.toBeNull();
    });

    it("deve exibir estado de equivalência quando os XMLs forem idênticos", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", SAMPLE_IDENTICAL_XML, "doc-a.xml");
      await uploadFile("rejected-file-input", SAMPLE_IDENTICAL_XML, "doc-b.xml");

      expect(container.querySelector('[data-testid="comparator-summary-identical"]')).not.toBeNull();
      expect(container.textContent).toContain("Nenhuma divergência encontrada");
      expect(container.textContent).toContain("0 divergências");
    });

    it("deve exibir erro claro quando o XML aprovado for inválido", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", "<root><unclosedTag></root>", "quebrado.xml");

      expect(container.textContent).toContain("Não foi possível interpretar o XML aprovado");
      expect(container.querySelector('[data-testid="comparator-error-banner"]')).not.toBeNull();
    });

    it("deve exibir erro claro quando o XML rejeitado contiver injeção XXE", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      const xxeXml = `<!DOCTYPE test [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]><root>&xxe;</root>`;
      await uploadFile("rejected-file-input", xxeXml, "xxe.xml");

      expect(container.textContent).toContain("Declarações de DTD/DOCTYPE ou ENTITY não são permitidas");
    });

    it("deve recalcular a comparação ao substituir um dos arquivos", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", SAMPLE_APPROVED_XML, "aprovado-v1.xml");
      await uploadFile("rejected-file-input", SAMPLE_REJECTED_XML, "rejeitado.xml");

      expect(container.textContent).toContain("PRODUTO TESTE APROVADO");

      // Substituir o aprovado por idêntico ao rejeitado
      await uploadFile("approved-file-input", SAMPLE_REJECTED_XML, "aprovado-v2.xml");

      // Agora deve estar idêntico
      expect(container.querySelector('[data-testid="comparator-summary-identical"]')).not.toBeNull();
    });

    it("deve limpar todos os estados ao clicar em 'Limpar Tudo'", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", SAMPLE_APPROVED_XML, "aprovado.xml");
      await uploadFile("rejected-file-input", SAMPLE_REJECTED_XML, "rejeitado.xml");

      const resetBtn = container.querySelector('[data-testid="reset-all-button"]') as HTMLButtonElement;
      expect(resetBtn).not.toBeNull();

      await act(async () => {
        resetBtn.click();
      });

      expect(container.querySelector('[data-testid="comparator-summary"]')).toBeNull();
      expect(container.querySelector('[data-testid="comparator-panels-container"]')).toBeNull();
      expect(container.textContent).not.toContain("aprovado.xml");
    });
  });

  describe("3. Seleção e Navegação de Divergências", () => {
    it("deve selecionar divergência ao clicar em uma linha destacada no painel XML", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", SAMPLE_APPROVED_XML, "aprovado.xml");
      await uploadFile("rejected-file-input", SAMPLE_REJECTED_XML, "rejeitado.xml");

      // 1. A primeira divergência é em infNFe (ATTRIBUTE_DIFF)
      const detailsPanel = container.querySelector('[data-testid="comparator-diff-details"]');
      expect(detailsPanel).not.toBeNull();
      expect(detailsPanel?.textContent).toContain("Caminho Canônico:");
      expect(detailsPanel?.textContent).toContain("Atributos com Divergência:");
      expect(detailsPanel?.textContent).toContain("@versao");

      // 2. Clicar em uma linha com VALUE_DIFF (ex: xProd ou vProd)
      const diffLines = Array.from(container.querySelectorAll('[data-diff-id]')) as HTMLDivElement[];
      const valueDiffLine = diffLines.find((el) => el.getAttribute("data-diff-id")?.startsWith("VALUE_DIFF"));
      expect(valueDiffLine).toBeDefined();

      await act(async () => {
        valueDiffLine?.click();
      });

      const updatedDetails = container.querySelector('[data-testid="comparator-diff-details"]');
      expect(updatedDetails?.textContent).toContain("Valor no XML Aprovado");
      expect(updatedDetails?.textContent).toContain("Valor no XML Rejeitado");
    });

    it("deve navegar entre divergências usando os botões Próxima e Anterior", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", SAMPLE_APPROVED_XML, "aprovado.xml");
      await uploadFile("rejected-file-input", SAMPLE_REJECTED_XML, "rejeitado.xml");

      const nextBtn = container.querySelector('[data-testid="nav-next-diff-button"]') as HTMLButtonElement;
      expect(nextBtn).not.toBeNull();

      const initialPath = container.querySelector('[data-testid="diff-details-path"]')?.textContent;

      await act(async () => {
        nextBtn.click();
      });

      const nextPath = container.querySelector('[data-testid="diff-details-path"]')?.textContent;
      // O path pode mudar ou o índice pode avançar
      expect(nextPath).toBeDefined();

      const prevBtn = container.querySelector('[data-testid="nav-prev-diff-button"]') as HTMLButtonElement;
      await act(async () => {
        prevBtn.click();
      });

      const finalPath = container.querySelector('[data-testid="diff-details-path"]')?.textContent;
      expect(finalPath).toBe(initialPath);
    });

    it("deve saltar diretamente para divergência ao clicar no chip de salto", async () => {
      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", SAMPLE_APPROVED_XML, "aprovado.xml");
      await uploadFile("rejected-file-input", SAMPLE_REJECTED_XML, "rejeitado.xml");

      // Por padrão, a primeira divergência já inicia selecionada
      expect(container.querySelector('[data-testid="diff-details-path"]')).not.toBeNull();

      const chipJump1 = container.querySelector('[data-testid="jump-diff-1"]') as HTMLButtonElement;
      expect(chipJump1).not.toBeNull();

      await act(async () => {
        chipJump1.click();
      });

      expect(container.querySelector('[data-testid="diff-details-path"]')).not.toBeNull();
    });
  });

  describe("4. Exportação do Relatório Markdown Sanitizado", () => {
    it("deve chamar exportador e acionar download de arquivo Markdown em caso de sucesso", async () => {
      // Mock de URL.createObjectURL e URL.revokeObjectURL
      const mockCreateObjectURL = vi.fn().mockReturnValue("blob:http://localhost/test-blob");
      const mockRevokeObjectURL = vi.fn();
      globalThis.URL.createObjectURL = mockCreateObjectURL;
      globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

      await act(async () => {
        root.render(<XmlComparatorView />);
      });

      await uploadFile("approved-file-input", SAMPLE_APPROVED_XML, "aprovado.xml");
      await uploadFile("rejected-file-input", SAMPLE_REJECTED_XML, "rejeitado.xml");
      await uploadFile("error-file-file-input", SAMPLE_ERROR_JSON, "erro.json", "application/json");

      const exportBtn = container.querySelector('[data-testid="header-export-button"]') as HTMLButtonElement;
      expect(exportBtn).not.toBeNull();

      await act(async () => {
        exportBtn.click();
      });

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(container.querySelector('[data-testid="comparator-export-success-banner"]')).not.toBeNull();
      expect(container.textContent).toContain("gerado e baixado com sucesso");
    });
  });
});
