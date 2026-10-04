import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CnpjIntelligenceView } from "@/features/cnpj-intelligence/presentation/CnpjIntelligenceView";
import { CnpjSearch } from "@/features/cnpj-intelligence/presentation/CnpjSearch";
import { CompanyOverview } from "@/features/cnpj-intelligence/presentation/CompanyOverview";
import { CompanyRegistration } from "@/features/cnpj-intelligence/presentation/CompanyRegistration";
import { CompanyActivities } from "@/features/cnpj-intelligence/presentation/CompanyActivities";
import { CompanyAddressSection } from "@/features/cnpj-intelligence/presentation/CompanyAddress";
import { CompanyPartners } from "@/features/cnpj-intelligence/presentation/CompanyPartners";
import { CompanyStatus } from "@/features/cnpj-intelligence/presentation/CompanyStatus";
import type { Company } from "@/features/cnpj-intelligence/domain";
import { BrasilApiClient } from "@/features/cnpj-intelligence/infrastructure";
import { CnpjConsultError } from "@/features/cnpj-intelligence/application";

// @ts-expect-error global declaration for React 19 act
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const MOCK_COMPANY: Company = {
  cnpj: "19131243000197",
  formattedCnpj: "19.131.243/0001-97",
  legalName: "OPEN KNOWLEDGE BRASIL",
  tradeName: "REDE PELO CONHECIMENTO LIVRE",
  registrationStatus: "ATIVA",
  registrationStatusDate: "03/10/2013",
  registrationStatusReason: "SEM MOTIVO",
  openingDate: "03/10/2013",
  companySize: "DEMAIS",
  shareCapital: 100000,
  formattedShareCapital: "R$ 100.000,00",
  taxRegime: {
    name: "Simples Nacional",
    isSimplesNacional: true,
    simplesOptDate: "03/10/2013",
    details: "Optante pelo Simples desde 03/10/2013",
  },
  legalNature: {
    code: "3999",
    description: "Associacao Privada",
  },
  address: {
    street: "R ALAMEDA FRANCA",
    number: "1410",
    complement: "APTO 01",
    neighborhood: "JARDIM PAULISTA",
    city: "SAO PAULO",
    state: "SP",
    zipCode: "01422-002",
    formattedAddress: "R ALAMEDA FRANCA, 1410 - APTO 01, JARDIM PAULISTA, SAO PAULO - SP, CEP 01422-002",
  },
  primaryActivity: {
    code: "9430-8/00",
    description: "Atividades de associacoes de defesa de direitos sociais",
  },
  secondaryActivities: [
    {
      code: "6311-9/00",
      description: "Tratamento de dados e servicos de hospedagem",
    },
  ],
  partners: [
    {
      name: "MARIO CESAR TEIXEIRA MARTINS",
      qualification: "Diretor",
      entryDate: "14/04/2021",
      ageRange: "Entre 31 e 40 anos",
      legalRepresentative: {
        name: "REPRESENTANTE LEGAL",
        qualification: "Procurador",
      },
    },
  ],
};

function setInputValue(input: HTMLInputElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(input, value);
  } else {
    input.value = value;
  }
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("CNPJ Intelligence — Presentation Layer", () => {
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

  describe("CnpjSearch", () => {
    it("deve renderizar o input com máscara e permitir digitação", () => {
      const onSearch = vi.fn();

      act(() => {
        root.render(<CnpjSearch onSearch={onSearch} />);
      });

      const input = container.querySelector("input") as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.placeholder).toBe("00.000.000/0000-00");

      act(() => {
        setInputValue(input, "19131243000197");
      });

      expect(input.value).toBe("19.131.243/0001-97");
    });

    it("deve exibir erro de validação ao submeter CNPJ inválido", () => {
      const onSearch = vi.fn();

      act(() => {
        root.render(<CnpjSearch onSearch={onSearch} />);
      });

      const form = container.querySelector("form") as HTMLFormElement;
      const input = container.querySelector("input") as HTMLInputElement;

      act(() => {
        setInputValue(input, "00000000000000");
      });

      act(() => {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });

      expect(onSearch).not.toHaveBeenCalled();
      expect(container.textContent).toContain("CNPJ inválido.");
    });

    it("deve chamar onSearch com dígitos limpos ao submeter CNPJ válido", () => {
      const onSearch = vi.fn();

      act(() => {
        root.render(<CnpjSearch onSearch={onSearch} />);
      });

      const form = container.querySelector("form") as HTMLFormElement;
      const input = container.querySelector("input") as HTMLInputElement;

      act(() => {
        setInputValue(input, "19131243000197");
      });

      act(() => {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });

      expect(onSearch).toHaveBeenCalledWith("19131243000197");
    });
  });

  describe("Seções Modulares de Apresentação", () => {
    it("CompanyOverview deve exibir razão social, nome fantasia, status e CNPJ formatado", () => {
      act(() => {
        root.render(<CompanyOverview company={MOCK_COMPANY} />);
      });

      expect(container.textContent).toContain("OPEN KNOWLEDGE BRASIL");
      expect(container.textContent).toContain("REDE PELO CONHECIMENTO LIVRE");
      expect(container.textContent).toContain("19.131.243/0001-97");
      expect(container.textContent).toContain("ATIVA");
    });

    it("CompanyStatus deve exibir badge com status e data da situação", () => {
      act(() => {
        root.render(<CompanyStatus company={MOCK_COMPANY} />);
      });

      expect(container.textContent).toContain("ATIVA");
      expect(container.textContent).toContain("03/10/2013");
    });

    it("CompanyRegistration deve exibir identificação, abertura, natureza, porte, capital social e regime tributário", () => {
      act(() => {
        root.render(<CompanyRegistration company={MOCK_COMPANY} />);
      });

      expect(container.textContent).toContain("Identificação e Dados Cadastrais");
      expect(container.textContent).toContain("03/10/2013");
      expect(container.textContent).toContain("Associacao Privada");
      expect(container.textContent).toContain("DEMAIS");
      expect(container.textContent).toContain("R$ 100.000,00");
      expect(container.textContent).toContain("Regime Tributário");
      expect(container.textContent).toContain("Simples Nacional");
      expect(container.textContent).toContain("Optante pelo Simples desde 03/10/2013");
    });

    it("CompanyActivities deve exibir CNAE principal e lista de secundárias", () => {
      act(() => {
        root.render(<CompanyActivities company={MOCK_COMPANY} />);
      });

      expect(container.textContent).toContain("Atividades Econômicas (CNAE)");
      expect(container.textContent).toContain("9430-8/00");
      expect(container.textContent).toContain("Atividades de associacoes de defesa de direitos sociais");
      expect(container.textContent).toContain("6311-9/00");
      expect(container.textContent).toContain("Tratamento de dados e servicos de hospedagem");
    });

    it("CompanyAddressSection deve exibir endereço consolidado e campos estruturados", () => {
      act(() => {
        root.render(<CompanyAddressSection company={MOCK_COMPANY} />);
      });

      expect(container.textContent).toContain("Endereço do Estabelecimento");
      expect(container.textContent).toContain("R ALAMEDA FRANCA");
      expect(container.textContent).toContain("1410");
      expect(container.textContent).toContain("01422-002");
      expect(container.textContent).toContain("SAO PAULO / SP");
    });

    it("CompanyPartners deve exibir lista de integrantes do QSA", () => {
      act(() => {
        root.render(<CompanyPartners company={MOCK_COMPANY} />);
      });

      expect(container.textContent).toContain("Quadro de Sócios e Administradores (QSA)");
      expect(container.textContent).toContain("MARIO CESAR TEIXEIRA MARTINS");
      expect(container.textContent).toContain("Diretor");
      expect(container.textContent).toContain("14/04/2021");
      expect(container.textContent).toContain("Entre 31 e 40 anos");
      expect(container.textContent).toContain("REPRESENTANTE LEGAL");
    });
  });

  describe("CnpjIntelligenceView (Orquestrador)", () => {
    it("deve renderizar o estado idle inicialmente", () => {
      act(() => {
        root.render(<CnpjIntelligenceView />);
      });

      expect(container.textContent).toContain("CNPJ Intelligence");
      expect(container.textContent).toContain("Nenhuma empresa consultada ainda");
    });

    it("deve renderizar os dados da empresa com sucesso após consulta", async () => {
      const mockGateway = new BrasilApiClient();
      vi.spyOn(mockGateway, "findByCnpj").mockResolvedValue(MOCK_COMPANY);

      await act(async () => {
        root.render(<CnpjIntelligenceView initialCnpj="19131243000197" gateway={mockGateway} />);
      });

      expect(container.textContent).toContain("OPEN KNOWLEDGE BRASIL");
      expect(container.textContent).toContain("ATIVA");
      expect(container.textContent).toContain("Nova consulta");
    });

    it("deve exibir estado not-found quando a empresa não for encontrada", async () => {
      const mockGateway = new BrasilApiClient();
      vi.spyOn(mockGateway, "findByCnpj").mockRejectedValue(
        new CnpjConsultError("NOT_FOUND", "Nenhuma empresa foi encontrada.")
      );

      await act(async () => {
        root.render(<CnpjIntelligenceView initialCnpj="19131243000197" gateway={mockGateway} />);
      });

      expect(container.textContent).toContain("Nenhuma empresa encontrada");
    });

    it("deve exibir estado de erro em caso de falha de conexão", async () => {
      const mockGateway = new BrasilApiClient();
      vi.spyOn(mockGateway, "findByCnpj").mockRejectedValue(
        new CnpjConsultError("NETWORK_ERROR", "Falha de conexão.")
      );

      await act(async () => {
        root.render(<CnpjIntelligenceView initialCnpj="19131243000197" gateway={mockGateway} />);
      });

      expect(container.textContent).toContain("Erro na consulta");
      expect(container.textContent).toContain("Não foi possível consultar os dados neste momento.");
    });
  });
});
