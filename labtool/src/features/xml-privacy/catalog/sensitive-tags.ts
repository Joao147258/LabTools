/**
 * XML Privacy — Sensitive Tags Catalog
 *
 * Responsabilidade:
 * Mapear nomes de campos/tags XML para suas respectivas categorias sensíveis
 * e ações sugeridas de sanitização, servindo como base declarativa inicial.
 *
 * Política de Privacidade Padrão:
 * - CPF, CNPJ, DOCUMENTO, CREDENCIAIS, NOME, RAZAO_SOCIAL, CONTATO, IDENTIFICADOR_DPS, ASSINATURA -> REPLACE / REMOVE
 * - TEXTO_LIVRE -> SCRUB_TEXT
 * - INSCRICAO (IM, IE) -> PRESERVE (não selecionado por padrão)
 * - ENDERECO (CEP, Logradouro, Número, Bairro, etc.) -> PRESERVE (não selecionado por padrão)
 *
 * O que NÃO faz:
 * - Não inspeciona nem percorre documentos XML;
 * - Não modifica árvores DOM;
 * - Não determina de forma isolada se um campo em tempo de execução deve ser sanitizado;
 *   o Inspector e a decisão do usuário definirão o escopo final.
 *
 * Pertence exclusivamente à feature: src/features/xml-privacy/
 */

import type {
  FieldCategory,
  SanitizationAction,
} from "../domain/sanitization.types";

export interface SensitiveTagDefinition {
  category: FieldCategory;
  suggestedAction: SanitizationAction;
}

/**
 * Normaliza o nome da tag XML para consulta determinística no catálogo.
 * Remove prefixos de atributos (@), pontuações, hífens, underscores e converte para minúsculas.
 */
export function normalizeTagName(name: string): string {
  if (!name || typeof name !== "string") {
    return "";
  }

  return name
    .trim()
    .replace(/^@/, "")
    .replace(/[._\-:\s]/g, "")
    .toLowerCase();
}

/**
 * Catálogo declarativo principal de tags sensíveis para o XML Privacy.
 */
export const SENSITIVE_TAGS = {
  // ==========================================================================
  // CPF
  // ==========================================================================
  cpf: { category: "CPF", suggestedAction: "REPLACE" },
  cpfemifiscal: { category: "CPF", suggestedAction: "REPLACE" },
  cpfdest: { category: "CPF", suggestedAction: "REPLACE" },
  cpfautxml: { category: "CPF", suggestedAction: "REPLACE" },
  cpftomador: { category: "CPF", suggestedAction: "REPLACE" },
  cpfprestador: { category: "CPF", suggestedAction: "REPLACE" },

  // ==========================================================================
  // CNPJ
  // ==========================================================================
  cnpj: { category: "CNPJ", suggestedAction: "REPLACE" },
  cnpjemifiscal: { category: "CNPJ", suggestedAction: "REPLACE" },
  cnpjdest: { category: "CNPJ", suggestedAction: "REPLACE" },
  cnpjautxml: { category: "CNPJ", suggestedAction: "REPLACE" },
  cnpjtoma: { category: "CNPJ", suggestedAction: "REPLACE" },
  cnpjprest: { category: "CNPJ", suggestedAction: "REPLACE" },
  cnpjemitente: { category: "CNPJ", suggestedAction: "REPLACE" },
  cnpjdestinatario: { category: "CNPJ", suggestedAction: "REPLACE" },

  // ==========================================================================
  // DOCUMENTO (Documentos de Identificação)
  // ==========================================================================
  idestrangeiro: { category: "DOCUMENTO", suggestedAction: "REPLACE" },
  rg: { category: "DOCUMENTO", suggestedAction: "REPLACE" },
  cnh: { category: "DOCUMENTO", suggestedAction: "REPLACE" },
  passaporte: { category: "DOCUMENTO", suggestedAction: "REPLACE" },
  docidentificacao: { category: "DOCUMENTO", suggestedAction: "REPLACE" },
  rginscricao: { category: "DOCUMENTO", suggestedAction: "REPLACE" },

  // ==========================================================================
  // CREDENCIAIS & SEGREDOS
  // ==========================================================================
  token: { category: "CREDENCIAIS", suggestedAction: "REPLACE" },
  senha: { category: "CREDENCIAIS", suggestedAction: "REPLACE" },
  password: { category: "CREDENCIAIS", suggestedAction: "REPLACE" },
  secret: { category: "CREDENCIAIS", suggestedAction: "REPLACE" },
  hash: { category: "CREDENCIAIS", suggestedAction: "REPLACE" },
  accesskey: { category: "CREDENCIAIS", suggestedAction: "REPLACE" },
  authtoken: { category: "CREDENCIAIS", suggestedAction: "REPLACE" },
  clientsecret: { category: "CREDENCIAIS", suggestedAction: "REPLACE" },
  authorization: { category: "CREDENCIAIS", suggestedAction: "REPLACE" },

  // ==========================================================================
  // NOMES
  // ==========================================================================
  xnome: { category: "NOME", suggestedAction: "REPLACE" },
  nome: { category: "NOME", suggestedAction: "REPLACE" },
  nomeresponsavel: { category: "NOME", suggestedAction: "REPLACE" },
  nomerequerente: { category: "NOME", suggestedAction: "REPLACE" },
  nomecontato: { category: "NOME", suggestedAction: "REPLACE" },
  nomeproprietario: { category: "NOME", suggestedAction: "REPLACE" },

  // ==========================================================================
  // RAZÃO SOCIAL & FANTASIA
  // ==========================================================================
  xfant: { category: "RAZAO_SOCIAL", suggestedAction: "REPLACE" },
  razaosocial: { category: "RAZAO_SOCIAL", suggestedAction: "REPLACE" },
  nomefantasia: { category: "RAZAO_SOCIAL", suggestedAction: "REPLACE" },
  xrazaosocial: { category: "RAZAO_SOCIAL", suggestedAction: "REPLACE" },

  // ==========================================================================
  // CONTATO
  // ==========================================================================
  email: { category: "CONTATO", suggestedAction: "REPLACE" },
  emailcontato: { category: "CONTATO", suggestedAction: "REPLACE" },
  fone: { category: "CONTATO", suggestedAction: "REPLACE" },
  telefone: { category: "CONTATO", suggestedAction: "REPLACE" },
  celular: { category: "CONTATO", suggestedAction: "REPLACE" },
  tel: { category: "CONTATO", suggestedAction: "REPLACE" },
  contato: { category: "CONTATO", suggestedAction: "REPLACE" },

  // ==========================================================================
  // INSCRIÇÃO FISCAL (Ação: PRESERVE — Não sanitizar/selecionar por padrão)
  // ==========================================================================
  im: { category: "INSCRICAO", suggestedAction: "PRESERVE" },
  inscricaomunicipal: { category: "INSCRICAO", suggestedAction: "PRESERVE" },
  imtomador: { category: "INSCRICAO", suggestedAction: "PRESERVE" },
  imprestador: { category: "INSCRICAO", suggestedAction: "PRESERVE" },
  inscricaomunicipaltomador: { category: "INSCRICAO", suggestedAction: "PRESERVE" },
  inscricaomunicipalprestador: { category: "INSCRICAO", suggestedAction: "PRESERVE" },
  ie: { category: "INSCRICAO", suggestedAction: "PRESERVE" },
  iest: { category: "INSCRICAO", suggestedAction: "PRESERVE" },
  isuf: { category: "INSCRICAO", suggestedAction: "PRESERVE" },
  inscricaoestadual: { category: "INSCRICAO", suggestedAction: "PRESERVE" },
  inss: { category: "INSCRICAO", suggestedAction: "PRESERVE" },
  cnae: { category: "INSCRICAO", suggestedAction: "PRESERVE" },

  // ==========================================================================
  // ENDEREÇO & LOCALIZAÇÃO (Ação: PRESERVE — Não sanitizar/selecionar por padrão)
  // ==========================================================================
  cep: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  xlgr: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  logradouro: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  nro: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  numero: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  xcpl: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  complemento: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  xbairro: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  bairro: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  endereco: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  codigopostal: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  cmun: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  xmun: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  uf: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  pais: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  cpais: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  xpais: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  xlocemi: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  xlocprestacao: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  xlocincid: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  clocemi: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  clocprestacao: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  clocincid: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  endernac: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  enderext: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  enderemit: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  enderdest: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  endertoma: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  enderprest: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  end: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  endnac: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  ender: { category: "ENDERECO", suggestedAction: "PRESERVE" },

  // ==========================================================================
  // TEXTO LIVRE & OBSERVAÇÕES (Ação: SCRUB_TEXT)
  // ==========================================================================
  infadic: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  infcpl: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  infadfisco: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  xobs: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  xmotivo: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  justificativa: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  xjust: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  obsinterna: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  observacao: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  descricao: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  dschist: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  mensagem: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },

  // ==========================================================================
  // IDENTIFICADORES DE DECLARAÇÃO / DPS
  // ==========================================================================
  iddps: { category: "IDENTIFICADOR_DPS", suggestedAction: "REPLACE" },
  idnfse: { category: "IDENTIFICADOR_DPS", suggestedAction: "REPLACE" },
  idrecibo: { category: "IDENTIFICADOR_DPS", suggestedAction: "REPLACE" },
  iddeclaracao: { category: "IDENTIFICADOR_DPS", suggestedAction: "REPLACE" },
  iddocumento: { category: "IDENTIFICADOR_DPS", suggestedAction: "REPLACE" },
  idrastreio: { category: "IDENTIFICADOR_DPS", suggestedAction: "REPLACE" },

  // ==========================================================================
  // ASSINATURA DIGITAL
  // ==========================================================================
  signature: { category: "ASSINATURA", suggestedAction: "REMOVE_SUBTREE" },
  signaturevalue: { category: "ASSINATURA", suggestedAction: "REPLACE" },
  x509certificate: { category: "ASSINATURA", suggestedAction: "REPLACE" },
  digestvalue: { category: "ASSINATURA", suggestedAction: "REPLACE" },
  dsig: { category: "ASSINATURA", suggestedAction: "REMOVE_SUBTREE" },
  signedinfo: { category: "ASSINATURA", suggestedAction: "REMOVE_SUBTREE" },
} as const satisfies Record<string, SensitiveTagDefinition>;

/**
 * Consulta a definição declarativa de uma tag no catálogo.
 */
export function getTagDefinition(tagName: string): SensitiveTagDefinition | undefined {
  const normalized = normalizeTagName(tagName);
  return SENSITIVE_TAGS[normalized as keyof typeof SENSITIVE_TAGS];
}

/**
 * Classifica uma tag com base no catálogo declarativo e fallbacks controlados.
 */
export function classifyTag(tagName: string): SensitiveTagDefinition {
  const directMatch = getTagDefinition(tagName);
  if (directMatch) {
    return directMatch;
  }

  const normalized = normalizeTagName(tagName);

  // Heurísticas simples e determinísticas de sufixo/prefixo
  if (normalized.endsWith("cpf") || normalized.startsWith("cpf")) {
    return { category: "CPF", suggestedAction: "REPLACE" };
  }
  if (normalized.endsWith("cnpj") || normalized.startsWith("cnpj")) {
    return { category: "CNPJ", suggestedAction: "REPLACE" };
  }
  if (normalized.includes("email") || normalized.includes("fone") || normalized.includes("celular")) {
    return { category: "CONTATO", suggestedAction: "REPLACE" };
  }
  if (normalized.includes("senha") || normalized.includes("token") || normalized.includes("secret")) {
    return { category: "CREDENCIAIS", suggestedAction: "REPLACE" };
  }
  if (
    normalized.includes("endereco") ||
    normalized.includes("ender") ||
    normalized.includes("logradouro") ||
    normalized.includes("bairro") ||
    normalized.includes("cep") ||
    normalized.includes("municipio") ||
    normalized.startsWith("cmun") ||
    normalized.startsWith("xmun") ||
    normalized.startsWith("cloc") ||
    normalized.startsWith("xloc")
  ) {
    return { category: "ENDERECO", suggestedAction: "PRESERVE" };
  }
  if (
    normalized.includes("inscricao") ||
    normalized === "im" ||
    normalized === "ie" ||
    normalized.startsWith("im") ||
    normalized.startsWith("ie") ||
    normalized.endsWith("im") ||
    normalized.endsWith("ie")
  ) {
    return { category: "INSCRICAO", suggestedAction: "PRESERVE" };
  }

  return { category: "OUTRO", suggestedAction: "PRESERVE" };
}

/**
 * Retorna a ação de sanitização sugerida para uma tag.
 */
export function getSuggestedAction(tagName: string): SanitizationAction {
  return classifyTag(tagName).suggestedAction;
}

/**
 * Categorias sensíveis que devem vir selecionadas por padrão para tratamento no XML Privacy.
 * INSCRICAO e ENDERECO permanecem com ação PRESERVE e não selecionadas por padrão.
 */
export const DEFAULT_SELECTED_CATEGORIES: readonly FieldCategory[] = [
  "CPF",
  "CNPJ",
  "DOCUMENTO",
  "CREDENCIAIS",
  "NOME",
  "RAZAO_SOCIAL",
  "CONTATO",
  "TEXTO_LIVRE",
  "IDENTIFICADOR_DPS",
  "ASSINATURA",
] as const;

/**
 * Determina se campos pertencentes a determinada categoria devem vir marcados por padrão.
 */
export function shouldSelectByDefault(category: FieldCategory): boolean {
  return DEFAULT_SELECTED_CATEGORIES.includes(category);
}
