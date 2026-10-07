import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { XmlPrivacyView } from "@/features/xml-sanitizer/presentation/XmlSanitizerView";
import { escapeHtml, highlightSanitizedTokens } from "@/features/xml-sanitizer/presentation/XmlCodeViewer";
import { formatBytes } from "@/features/xml-sanitizer/presentation/XmlUploadDropzone";
import { MAX_XML_SIZE_BYTES } from "@/features/xml-sanitizer/application";

// Configurar ambiente React 19 act
// @ts-expect-error global declaration for act
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Sample fixture XML com dados cadastrais e observações
const SAMPLE_XML = `<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe35230912345678000195550010000001231234567890">
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
      <infAdic>
        <infCpl>Entregar para contato joao@email.com telefone (11) 98888-7777</infCpl>
      </infAdic>
    </infNFe>
    <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
      <SignedInfo><DigestValue>xyz==</DigestValue></SignedInfo>
    </Signature>
  </NFe>
</nfeProc>`;

describe("XML Privacy — Presentation Layer", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    // Configura container DOM para testes React 19
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

  describe("Estado Inicial e Tela de Upload", () => {
    it("deve renderizar a tela de upload inicial com o aviso de processamento local", async () => {
      await act(async () => {
        root.render(<XmlPrivacyView />);
      });

      expect(container.textContent).toContain("XML Sanitizer");
      expect(container.textContent).toContain("Sanitização e privacidade segura de documentos fiscais XML");
      expect(container.textContent).toContain("Processamento 100% local no navegador");
      expect(container.textContent).toContain("Máximo: 20 MB");

      const dropzone = container.querySelector('[role="button"]');
      expect(dropzone).not.toBeNull();
    });

    it("deve rejeitar arquivos com extensão diferente de .xml", async () => {
      await act(async () => {
        root.render(<XmlPrivacyView />);
      });

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).not.toBeNull();

      const invalidFile = new File(["dummy text content"], "documento.pdf", { type: "application/pdf" });

      await act(async () => {
        Object.defineProperty(fileInput, "files", {
          value: [invalidFile],
          writable: true,
        });
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      expect(container.textContent).toContain("Formato de arquivo inválido. Selecione um arquivo com extensão .xml.");
    });
  });

  describe("Ingestão de XML e Transição para o Workspace", () => {
    it("deve carregar XML válido, inspecionar campos e renderizar o workspace", async () => {
      await act(async () => {
        root.render(<XmlPrivacyView />);
      });

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = new File([SAMPLE_XML], "nfe-teste.xml", { type: "application/xml" });

      await act(async () => {
        // Simular leitura de arquivo via FileReader
        Object.defineProperty(fileInput, "files", {
          value: [validFile],
          writable: true,
        });
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      // Aguarda processamento do FileReader
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      // Deve estar no workspace
      expect(container.textContent).toContain("nfe-teste.xml");
      expect(container.textContent).toContain("Nota de conformidade");
      expect(container.textContent).toContain("Campos Inspecionados");
      expect(container.textContent).toContain("XML Sanitizado");

      // Deve listar as tags principais
      expect(container.textContent).toContain("CNPJ");
      expect(container.textContent).toContain("xNome");
      expect(container.textContent).toContain("CPF");
      expect(container.textContent).toContain("infCpl");
      expect(container.textContent).toContain("Signature");
    });

    it("deve exibir erro claro ao tentar carregar XML malformado", async () => {
      await act(async () => {
        root.render(<XmlPrivacyView />);
      });

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const malformedXml = "<root><unclosedTag></root>";
      const badFile = new File([malformedXml], "malformed.xml", { type: "application/xml" });

      await act(async () => {
        Object.defineProperty(fileInput, "files", {
          value: [badFile],
          writable: true,
        });
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(container.textContent).toContain("Erro de processamento");
      expect(container.textContent).toContain("XML malformado");
    });
  });

  describe("Métricas e Ações de Seleção de Campos", () => {
    it("deve permitir alternar seleção de campos e recalcular métricas em tempo real", async () => {
      await act(async () => {
        root.render(<XmlPrivacyView />);
      });

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = new File([SAMPLE_XML], "nfe-teste.xml", { type: "application/xml" });

      await act(async () => {
        Object.defineProperty(fileInput, "files", {
          value: [validFile],
          writable: true,
        });
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      const checkboxes = container.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
      expect(checkboxes.length).toBeGreaterThan(0);

      // Clicar em "Desmarcar todos"
      const deselectAllBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Desmarcar todos")
      );
      expect(deselectAllBtn).toBeDefined();

      await act(async () => {
        deselectAllBtn?.click();
      });

      // Contadores devem refletir 0 selecionados
      expect(container.textContent).toContain("0 de 10 selecionados");

      // Clicar em "Restaurar padrões"
      const restoreBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Restaurar padrões")
      );
      expect(restoreBtn).toBeDefined();

      await act(async () => {
        restoreBtn?.click();
      });

      // Contadores voltam a ter campos selecionados por padrão (7 de 10)
      expect(container.textContent).toContain("7 de 10 selecionados");
    });

    it("deve permitir resetar e voltar para tela de upload ao clicar em 'Trocar arquivo'", async () => {
      await act(async () => {
        root.render(<XmlPrivacyView />);
      });

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = new File([SAMPLE_XML], "nfe-teste.xml", { type: "application/xml" });

      await act(async () => {
        Object.defineProperty(fileInput, "files", {
          value: [validFile],
          writable: true,
        });
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      const trocarBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Trocar arquivo")
      );
      expect(trocarBtn).toBeDefined();

      await act(async () => {
        trocarBtn?.click();
      });

      // Deve ter voltado para a tela inicial
      expect(container.textContent).toContain("Arraste e solte o arquivo XML aqui ou clique para selecionar");
    });
  });

  describe("Segurança contra XSS na Visualização de Código", () => {
    it("deve escapar tags perigosas e scripts para evitar execução de XSS", () => {
      const maliciousContent = '<xNome><![CDATA[<script>alert("XSS")</script>]]></xNome><img src="x" onerror="alert(1)"/>';
      const escaped = escapeHtml(maliciousContent);

      expect(escaped).not.toContain("<script>");
      expect(escaped).not.toContain("<img");
      expect(escaped).toContain("&lt;script&gt;");
      expect(escaped).toContain("&lt;img");
      expect(escaped).toContain("&quot;XSS&quot;");
    });

    it("deve aplicar realce visual seguro em tokens sintéticos", () => {
      const escapedWithToken = "O emitente &lt;CNPJ&gt;[CNPJ_001]&lt;/CNPJ&gt; foi sanitizado.";
      const highlighted = highlightSanitizedTokens(escapedWithToken);

      expect(highlighted).toContain("[CNPJ_001]");
      expect(highlighted).toContain("span");
      expect(highlighted).toContain("&lt;CNPJ&gt;");
    });
  });

  describe("Consistência de Limites e Utilitários", () => {
    it("deve ter o limite de 20MB exatamente alinhado entre Application e Presentation", () => {
      expect(MAX_XML_SIZE_BYTES).toBe(20 * 1024 * 1024);
      expect(formatBytes(MAX_XML_SIZE_BYTES)).toBe("20 MB");
    });

    it("deve formatar bytes corretamente", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1024 * 1024 * 5)).toBe("5 MB");
    });
  });
});
