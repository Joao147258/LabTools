import { describe, it, expect } from "vitest";
import { CompanyApiMapper } from "@/features/cnpj-intelligence/infrastructure";
import type { BrasilApiCnpjResponse } from "@/features/cnpj-intelligence/infrastructure";

describe("CNPJ Intelligence — Infrastructure: CompanyApiMapper", () => {
  const fullPayload: BrasilApiCnpjResponse = {
    cnpj: "19131243000197",
    identificador_matriz_filial: 1,
    descricao_matriz_filial: "MATRIZ",
    razao_social: "OPEN KNOWLEDGE BRASIL",
    nome_fantasia: "REDE PELO CONHECIMENTO LIVRE",
    situacao_cadastral: 2,
    descricao_situacao_cadastral: "ATIVA",
    data_situacao_cadastral: "2013-10-03",
    motivo_situacao_cadastral: 0,
    descricao_motivo_situacao_cadastral: "SEM MOTIVO",
    situacao_especial: "EM RECUPERACAO",
    data_situacao_especial: "2020-01-10",
    data_inicio_atividade: "2013-10-03",
    cnae_fiscal: 9430800,
    cnae_fiscal_descricao: "Atividades de associacoes de defesa de direitos sociais",
    natureza_juridica: "Associacao Privada",
    codigo_natureza_juridica: 3999,
    logradouro: "R ALAMEDA FRANCA",
    numero: "1410",
    complemento: "APTO 01",
    cep: 1422002,
    bairro: "JARDIM PAULISTA",
    municipio: "SAO PAULO",
    uf: "SP",
    porte: "DEMAIS",
    codigo_porte: 5,
    capital_social: 50000,
    cnaes_secundarios: [
      {
        codigo: 6311900,
        descricao: "Tratamento de dados, provedores de servicos de hospedagem na internet",
      },
    ],
    qsa: [
      {
        identificador_de_socio: 2,
        nome_socio: "MARIO CESAR TEIXEIRA MARTINS",
        qualificacao_socio: "Diretor",
        data_entrada_sociedade: "2021-04-14",
        faixa_etaria: "Entre 31 e 40 anos",
        nome_representante_legal: "JOSE DA SILVA",
        qualificacao_representante_legal: "Procurador",
      },
    ],
  };

  it("deve mapear payload completo da BrasilAPI para o modelo de domínio Company", () => {
    const company = CompanyApiMapper.toDomain(fullPayload);

    expect(company.cnpj).toBe("19131243000197");
    expect(company.formattedCnpj).toBe("19.131.243/0001-97");
    expect(company.legalName).toBe("OPEN KNOWLEDGE BRASIL");
    expect(company.tradeName).toBe("REDE PELO CONHECIMENTO LIVRE");
    expect(company.registrationStatus).toBe("ATIVA");
    expect(company.registrationStatusDate).toBe("03/10/2013");
    expect(company.specialStatus).toBe("EM RECUPERACAO");
    expect(company.specialStatusDate).toBe("10/01/2020");
    expect(company.openingDate).toBe("03/10/2013");
    expect(company.companySize).toBe("DEMAIS");
    expect(company.shareCapital).toBe(50000);
    expect(company.formattedShareCapital).toContain("50.000,00");

    // Natureza jurídica
    expect(company.legalNature?.code).toBe("3999");
    expect(company.legalNature?.description).toBe("Associacao Privada");

    // Endereço
    expect(company.address?.street).toBe("R ALAMEDA FRANCA");
    expect(company.address?.number).toBe("1410");
    expect(company.address?.complement).toBe("APTO 01");
    expect(company.address?.neighborhood).toBe("JARDIM PAULISTA");
    expect(company.address?.city).toBe("SAO PAULO");
    expect(company.address?.state).toBe("SP");
    expect(company.address?.zipCode).toBe("01422-002");
    expect(company.address?.formattedAddress).toContain("R ALAMEDA FRANCA, 1410 - APTO 01");

    // CNAE principal e secundários
    expect(company.primaryActivity?.code).toBe("9430-8/00");
    expect(company.primaryActivity?.description).toBe(
      "Atividades de associacoes de defesa de direitos sociais"
    );
    expect(company.secondaryActivities).toHaveLength(1);
    expect(company.secondaryActivities?.[0].code).toBe("6311-9/00");

    // QSA
    expect(company.partners).toHaveLength(1);
    const partner = company.partners?.[0];
    expect(partner?.name).toBe("MARIO CESAR TEIXEIRA MARTINS");
    expect(partner?.qualification).toBe("Diretor");
    expect(partner?.entryDate).toBe("14/04/2021");
    expect(partner?.ageRange).toBe("Entre 31 e 40 anos");
    expect(partner?.legalRepresentative?.name).toBe("JOSE DA SILVA");
    expect(partner?.legalRepresentative?.qualification).toBe("Procurador");
  });

  it("deve mapear com segurança payload mínimo com campos ausentes ou nulos", () => {
    const minimalPayload: BrasilApiCnpjResponse = {
      cnpj: "19131243000197",
      razao_social: "EMPRESA MINIMA LTDA",
      situacao_cadastral: 8,
    };

    const company = CompanyApiMapper.toDomain(minimalPayload);

    expect(company.cnpj).toBe("19131243000197");
    expect(company.legalName).toBe("EMPRESA MINIMA LTDA");
    expect(company.tradeName).toBeUndefined();
    expect(company.registrationStatus).toBe("BAIXADA");
    expect(company.registrationStatusDate).toBeUndefined();
    expect(company.address).toBeUndefined();
    expect(company.primaryActivity).toBeUndefined();
    expect(company.secondaryActivities).toEqual([]);
    expect(company.partners).toEqual([]);
  });

  it("deve ignorar parceiros sem nome no QSA", () => {
    const payloadWithEmptyPartner: BrasilApiCnpjResponse = {
      cnpj: "19131243000197",
      razao_social: "TESTE LTDA",
      situacao_cadastral: 2,
      qsa: [
        {
          nome_socio: "",
          qualificacao_socio: "Sócio",
        },
        {
          nome_socio: "FULANO DE TAL",
          qualificacao_socio: "Sócio-Administrador",
        },
      ],
    };

    const company = CompanyApiMapper.toDomain(payloadWithEmptyPartner);
    expect(company.partners).toHaveLength(1);
    expect(company.partners?.[0].name).toBe("FULANO DE TAL");
  });

  it("deve mapear corretamente dados de regime tributário do Simples e MEI", () => {
    const payloadSimples: BrasilApiCnpjResponse = {
      cnpj: "19131243000197",
      razao_social: "PEQUENA EMPRESA LTDA",
      situacao_cadastral: 2,
      opcao_pelo_simples: true,
      data_opcao_pelo_simples: "2019-01-01",
      opcao_pelo_mei: false,
    };

    const company = CompanyApiMapper.toDomain(payloadSimples);
    expect(company.taxRegime?.name).toBe("Simples Nacional");
    expect(company.taxRegime?.isSimplesNacional).toBe(true);
    expect(company.taxRegime?.isMei).toBe(false);
    expect(company.taxRegime?.simplesOptDate).toBe("01/01/2019");
    expect(company.taxRegime?.details).toBe("Optante pelo Simples desde 01/01/2019");
  });

  it("deve mapear histórico e ano mais recente de apuração de regime tributário da BrasilAPI", () => {
    const payloadRegime: BrasilApiCnpjResponse = {
      cnpj: "19131243000197",
      razao_social: "INSTITUTO BRASILEIRO",
      situacao_cadastral: 2,
      opcao_pelo_simples: null,
      opcao_pelo_mei: null,
      regime_tributario: [
        { ano: 2022, forma_de_tributacao: "ISENTO DO IRPJ" },
        { ano: 2024, forma_de_tributacao: "IMUNE DE IRPJ" },
        { ano: 2023, forma_de_tributacao: "ISENTO DO IRPJ" },
      ],
    };

    const company = CompanyApiMapper.toDomain(payloadRegime);
    expect(company.taxRegime?.name).toBe("IMUNE DE IRPJ (2024)");
    expect(company.taxRegime?.isSimplesNacional).toBe(false);
  });
});
