/**
 * CNPJ Intelligence — External Provider API Types (BrasilAPI)
 *
 * Contrato de transporte bruto retornado pela API pública de CNPJ (BrasilAPI v1).
 */

export interface BrasilApiCnaesSecundario {
  codigo: number | string;
  descricao: string;
}

export interface BrasilApiQsa {
  identificador_de_socio?: number;
  nome_socio: string;
  cnpj_cpf_do_socio?: string;
  codigo_qualificacao_socio?: number;
  qualificacao_socio?: string;
  data_entrada_sociedade?: string;
  faixa_etaria?: string;
  nome_representante_legal?: string;
  codigo_qualificacao_representante_legal?: number;
  qualificacao_representante_legal?: string;
}

export interface BrasilApiTaxRegimeEntry {
  ano: number;
  forma_de_tributacao: string;
  cnpj_da_scp?: string | null;
  quantidade_de_escrituracoes?: number;
}

export interface BrasilApiCnpjResponse {
  cnpj: string;
  identificador_matriz_filial?: number;
  descricao_matriz_filial?: string;
  razao_social: string;
  nome_fantasia?: string;
  situacao_cadastral: number | string;
  descricao_situacao_cadastral?: string;
  data_situacao_cadastral?: string;
  motivo_situacao_cadastral?: number;
  descricao_motivo_situacao_cadastral?: string;
  situacao_especial?: string;
  data_situacao_especial?: string;
  data_inicio_atividade?: string;
  cnae_fiscal?: number | string;
  cnae_fiscal_descricao?: string;
  cnaes_secundarios?: BrasilApiCnaesSecundario[];
  natureza_juridica?: string;
  codigo_natureza_juridica?: number | string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string | number;
  uf?: string;
  municipio?: string;
  codigo_municipio?: number;
  porte?: string;
  codigo_porte?: number;
  capital_social?: number;
  opcao_pelo_simples?: boolean | null;
  data_opcao_pelo_simples?: string | null;
  data_exclusao_do_simples?: string | null;
  opcao_pelo_mei?: boolean | null;
  data_opcao_pelo_mei?: string | null;
  data_exclusao_do_mei?: string | null;
  regime_tributario?: BrasilApiTaxRegimeEntry[] | string | null;
  qsa?: BrasilApiQsa[];
  message?: string;
  type?: string;
  name?: string;
  errors?: Array<{ message: string; code?: string }>;
}
