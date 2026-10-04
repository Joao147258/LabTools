/**
 * CNPJ Intelligence — External Provider Mapper
 *
 * Mapeia e higieniza a resposta crua da BrasilAPI para o modelo de domínio Company.
 * Isola completamente a aplicação do schema de rede externo.
 */

import type {
  Company,
  CompanyActivity,
  CompanyAddress,
  CompanyPartner,
  LegalNature,
} from "../domain";
import {
  buildConsolidatedAddress,
  buildTaxRegime,
  createCompanyActivity,
  createCompanyPartner,
  formatCnpj,
  formatCurrencyBrl,
  formatDateIsoToBr,
  formatZipCode,
  normalizeCnpj,
  normalizeRegistrationStatus,
} from "../domain";
import type { BrasilApiCnpjResponse } from "./brasil-api.types";

export class CompanyApiMapper {
  /**
   * Converte o payload retornado pela BrasilAPI em uma entidade Company pura de domínio.
   */
  public static toDomain(raw: BrasilApiCnpjResponse): Company {
    const normCnpj = normalizeCnpj(raw.cnpj);
    const formattedCnpj = formatCnpj(normCnpj);

    // Razão Social obrigatória
    const legalName = (raw.razao_social || "").trim() || "RAZÃO SOCIAL NÃO INFORMADA";

    // Nome Fantasia opcional
    const tradeName = (raw.nome_fantasia || "").trim() || undefined;

    // Situação Cadastral
    const registrationStatusRaw =
      raw.descricao_situacao_cadastral ||
      (raw.situacao_cadastral !== undefined ? String(raw.situacao_cadastral) : undefined);
    const registrationStatus = normalizeRegistrationStatus(
      raw.descricao_situacao_cadastral || raw.situacao_cadastral
    );

    // Datas e motivos
    const registrationStatusDate = formatDateIsoToBr(raw.data_situacao_cadastral) || undefined;
    const registrationStatusReason =
      (raw.descricao_motivo_situacao_cadastral || "").trim() || undefined;

    const specialStatus = (raw.situacao_especial || "").trim() || undefined;
    const specialStatusDate = formatDateIsoToBr(raw.data_situacao_especial) || undefined;
    const openingDate = formatDateIsoToBr(raw.data_inicio_atividade) || undefined;

    // Natureza Jurídica
    let legalNature: LegalNature | undefined;
    if (raw.natureza_juridica || raw.codigo_natureza_juridica) {
      legalNature = {
        code: raw.codigo_natureza_juridica ? String(raw.codigo_natureza_juridica).trim() : undefined,
        description: (raw.natureza_juridica || "").trim() || undefined,
      };
    }

    // Porte e Capital Social
    const companySize = (raw.porte || "").trim() || undefined;
    const shareCapital = typeof raw.capital_social === "number" ? raw.capital_social : undefined;
    const formattedShareCapital =
      shareCapital !== undefined ? formatCurrencyBrl(shareCapital) : undefined;

    // Regime Tributário (Simples Nacional / MEI / Regime Normal / Lucro Real ou Presumido)
    let customRegimeName: string | undefined;
    if (Array.isArray(raw.regime_tributario) && raw.regime_tributario.length > 0) {
      const sorted = [...raw.regime_tributario].sort((a, b) => (b.ano || 0) - (a.ano || 0));
      const latest = sorted[0];
      if (latest && latest.forma_de_tributacao) {
        customRegimeName = `${latest.forma_de_tributacao} (${latest.ano})`;
      }
    } else if (typeof raw.regime_tributario === "string" && raw.regime_tributario.trim()) {
      customRegimeName = raw.regime_tributario.trim();
    }

    const taxRegime = buildTaxRegime({
      isSimples: raw.opcao_pelo_simples,
      simplesOptDate: raw.data_opcao_pelo_simples,
      simplesExcludedDate: raw.data_exclusao_do_simples,
      isMei: raw.opcao_pelo_mei,
      meiOptDate: raw.data_opcao_pelo_mei,
      meiExcludedDate: raw.data_exclusao_do_mei,
      customName: customRegimeName,
    });

    // Endereço
    let address: CompanyAddress | undefined;
    if (raw.logradouro || raw.municipio || raw.uf || raw.cep) {
      const rawCep = raw.cep ? String(raw.cep).replace(/\D/g, "") : undefined;
      const formattedCep = rawCep ? formatZipCode(rawCep) : undefined;

      const baseAddress: CompanyAddress = {
        street: (raw.logradouro || "").trim() || undefined,
        number: (raw.numero || "").trim() || undefined,
        complement: (raw.complemento || "").trim() || undefined,
        neighborhood: (raw.bairro || "").trim() || undefined,
        zipCode: formattedCep || rawCep || undefined,
        city: (raw.municipio || "").trim() || undefined,
        state: (raw.uf || "").trim() || undefined,
      };

      baseAddress.formattedAddress = buildConsolidatedAddress(baseAddress) || undefined;
      address = baseAddress;
    }

    // Atividade Principal
    let primaryActivity: CompanyActivity | undefined;
    if (raw.cnae_fiscal || raw.cnae_fiscal_descricao) {
      primaryActivity = createCompanyActivity(raw.cnae_fiscal, raw.cnae_fiscal_descricao);
    }

    // Atividades Secundárias
    const secondaryActivities: CompanyActivity[] = [];
    if (Array.isArray(raw.cnaes_secundarios)) {
      for (const item of raw.cnaes_secundarios) {
        if (item && (item.codigo || item.descricao)) {
          secondaryActivities.push(createCompanyActivity(item.codigo, item.descricao));
        }
      }
    }

    // Quadro Societário (QSA)
    const partners: CompanyPartner[] = [];
    if (Array.isArray(raw.qsa)) {
      for (const item of raw.qsa) {
        if (item && item.nome_socio) {
          const partner = createCompanyPartner({
            name: item.nome_socio,
            qualification: item.qualificacao_socio,
            entryDate: formatDateIsoToBr(item.data_entrada_sociedade),
            ageRange: item.faixa_etaria,
            legalRepresentativeName: item.nome_representante_legal,
            legalRepresentativeQualification: item.qualificacao_representante_legal,
          });
          if (partner) {
            partners.push(partner);
          }
        }
      }
    }

    return {
      cnpj: normCnpj,
      formattedCnpj,
      legalName,
      tradeName,
      registrationStatus,
      registrationStatusRaw,
      registrationStatusDate,
      registrationStatusReason,
      specialStatus,
      specialStatusDate,
      openingDate,
      legalNature,
      companySize,
      shareCapital,
      formattedShareCapital,
      taxRegime,
      address,
      primaryActivity,
      secondaryActivities,
      partners,
    };
  }
}
