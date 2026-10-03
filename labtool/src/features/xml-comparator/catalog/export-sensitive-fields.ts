/**
 * XML Comparator — Export Sensitive Fields Catalog
 *
 * Responsabilidade:
 * Catálogo declarativo de campos sensíveis para orientar a sanitização
 * do relatório técnico, diferenças estruturais, mensagens de erro e exportações
 * Markdown geradas pelo XML Comparator.
 *
 * Política de Sanitização Padrão:
 * - CNPJ, CPF, NOME, RAZAO_SOCIAL, CONTATO, IDENTIFICADOR_DPS, DOCUMENTO, ASSINATURA -> Sanitizar / Remover
 * - ENDERECO (CEP, Logradouro, Número, Bairro, Município, UF, etc.) -> PRESERVAR (não sanitizar automaticamente)
 * - INSCRICAO (Inscrição Municipal IM, Inscrição Estadual IE) -> PRESERVAR (não sanitizar automaticamente)
 * - TEXTO_LIVRE -> Higienização via regex scrubFreeText
 *
 * Regras Obrigatórias:
 * - INSCRIÇÃO MUNICIPAL NÃO DEVE SER MASCARADA (preserva IM, InscricaoMunicipal, imTomador, imPrestador, etc.);
 * - ENDEREÇO NÃO DEVE SER MASCARADO (preserva CEP, xLgr, nro, xBairro, xCpl, cMun, xMun, UF, etc.);
 * - As categorias INSCRICAO e ENDERECO permanecem no domínio, mas shouldSanitizeByDefault retorna false.
 *
 * Pertence exclusivamente à feature: src/features/xml-comparator/
 */

import type { ComparisonFieldCategory } from "../domain";

export type ExportSanitizationAction =
  | "PRESERVE"
  | "MASK_TOKEN"
  | "REPLACE"
  | "SCRUB_TEXT"
  | "REMOVE";

export interface ExportSensitiveFieldDefinition {
  category: ComparisonFieldCategory;
  suggestedAction: ExportSanitizationAction;
}

/**
 * Normaliza nomes de tags, atributos e campos de relatório do Comparator
 * para consulta no catálogo de exportação.
 */
export function normalizeComparatorField(name: string): string {
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
 * Catálogo declarativo de campos sensíveis para a exportação do XML Comparator.
 */
export const EXPORT_SENSITIVE_FIELDS = {
  // ==========================================================================
  // CPF (Ação: MASK_TOKEN)
  // ==========================================================================
  cpf: { category: "CPF", suggestedAction: "MASK_TOKEN" },
  cpfdest: { category: "CPF", suggestedAction: "MASK_TOKEN" },
  cpfautxml: { category: "CPF", suggestedAction: "MASK_TOKEN" },
  cpftomador: { category: "CPF", suggestedAction: "MASK_TOKEN" },
  cpfprestador: { category: "CPF", suggestedAction: "MASK_TOKEN" },

  // ==========================================================================
  // CNPJ (Ação: MASK_TOKEN)
  // ==========================================================================
  cnpj: { category: "CNPJ", suggestedAction: "MASK_TOKEN" },
  cnpjdest: { category: "CNPJ", suggestedAction: "MASK_TOKEN" },
  cnpjautxml: { category: "CNPJ", suggestedAction: "MASK_TOKEN" },
  cnpjtoma: { category: "CNPJ", suggestedAction: "MASK_TOKEN" },
  cnpjprest: { category: "CNPJ", suggestedAction: "MASK_TOKEN" },
  cnpjemitente: { category: "CNPJ", suggestedAction: "MASK_TOKEN" },
  cnpjdestinatario: { category: "CNPJ", suggestedAction: "MASK_TOKEN" },

  // ==========================================================================
  // DOCUMENTOS DE IDENTIFICAÇÃO & CREDENCIAIS (Ação: MASK_TOKEN)
  // ==========================================================================
  idestrangeiro: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  rg: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  cnh: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  passaporte: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  docidentificacao: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  token: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  senha: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  password: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  secret: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  hash: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  accesskey: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  authtoken: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  clientsecret: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  authorization: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },

  // ==========================================================================
  // NOMES (Ação: MASK_TOKEN)
  // ==========================================================================
  xnome: { category: "NOME", suggestedAction: "MASK_TOKEN" },
  nome: { category: "NOME", suggestedAction: "MASK_TOKEN" },
  nomeresponsavel: { category: "NOME", suggestedAction: "MASK_TOKEN" },
  nomerequerente: { category: "NOME", suggestedAction: "MASK_TOKEN" },
  nomecontato: { category: "NOME", suggestedAction: "MASK_TOKEN" },
  nomeproprietario: { category: "NOME", suggestedAction: "MASK_TOKEN" },

  // ==========================================================================
  // RAZÃO SOCIAL & FANTASIA (Ação: MASK_TOKEN)
  // ==========================================================================
  xfant: { category: "RAZAO_SOCIAL", suggestedAction: "MASK_TOKEN" },
  razaosocial: { category: "RAZAO_SOCIAL", suggestedAction: "MASK_TOKEN" },
  nomefantasia: { category: "RAZAO_SOCIAL", suggestedAction: "MASK_TOKEN" },
  xrazaosocial: { category: "RAZAO_SOCIAL", suggestedAction: "MASK_TOKEN" },

  // ==========================================================================
  // CONTATO (Ação: MASK_TOKEN)
  // ==========================================================================
  email: { category: "CONTATO", suggestedAction: "MASK_TOKEN" },
  emailcontato: { category: "CONTATO", suggestedAction: "MASK_TOKEN" },
  fone: { category: "CONTATO", suggestedAction: "MASK_TOKEN" },
  telefone: { category: "CONTATO", suggestedAction: "MASK_TOKEN" },
  celular: { category: "CONTATO", suggestedAction: "MASK_TOKEN" },
  tel: { category: "CONTATO", suggestedAction: "MASK_TOKEN" },
  contato: { category: "CONTATO", suggestedAction: "MASK_TOKEN" },

  // ==========================================================================
  // INSCRIÇÃO FISCAL (Ação: PRESERVE — Não sanitizar automaticamente)
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

  // ==========================================================================
  // ENDEREÇO & LOCALIZAÇÃO (Ação: PRESERVE — Não sanitizar automaticamente)
  // ==========================================================================
  cep: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  xlgr: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  logradouro: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  nro: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  numero: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  xbairro: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  bairro: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  xcpl: { category: "ENDERECO", suggestedAction: "PRESERVE" },
  complemento: { category: "ENDERECO", suggestedAction: "PRESERVE" },
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
  // IDENTIFICADORES DE DOCUMENTOS & PROTOCOLOS (Ação: MASK_TOKEN)
  // ==========================================================================
  chnfe: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  chcte: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  chcanc: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  chacesso: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  id: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  iddps: { category: "IDENTIFICADOR_DPS", suggestedAction: "MASK_TOKEN" },
  idnfse: { category: "IDENTIFICADOR_DPS", suggestedAction: "MASK_TOKEN" },
  idrecibo: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  nprot: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  nrec: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },

  // ==========================================================================
  // ASSINATURAS DIGITAIS & CHAVES CRIPTOGRÁFICAS (Ação: REMOVE / MASK_TOKEN)
  // ==========================================================================
  signature: { category: "ASSINATURA", suggestedAction: "REMOVE" },
  signaturevalue: { category: "ASSINATURA", suggestedAction: "MASK_TOKEN" },
  x509certificate: { category: "ASSINATURA", suggestedAction: "MASK_TOKEN" },
  digestvalue: { category: "ASSINATURA", suggestedAction: "MASK_TOKEN" },
  uri: { category: "ASSINATURA", suggestedAction: "MASK_TOKEN" },
  dsig: { category: "ASSINATURA", suggestedAction: "REMOVE" },
  signedinfo: { category: "ASSINATURA", suggestedAction: "REMOVE" },

  // ==========================================================================
  // TEXTO LIVRE, MENSAGENS E RELATÓRIOS DE ERRO (Ação: SCRUB_TEXT)
  // ==========================================================================
  xmotivo: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  xobs: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  infcpl: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  infadic: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  infadfisco: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  justificativa: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  xjust: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  descricao: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  mensagem: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  erro: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
  error: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },
} as const satisfies Record<string, ExportSensitiveFieldDefinition>;

/**
 * Consulta a definição declarativa de um campo de exportação.
 */
export function getExportFieldDefinition(
  fieldName: string
): ExportSensitiveFieldDefinition | undefined {
  const normalized = normalizeComparatorField(fieldName);
  return EXPORT_SENSITIVE_FIELDS[normalized as keyof typeof EXPORT_SENSITIVE_FIELDS];
}

/**
 * Determina se uma categoria de campo deve ser sanitizada por padrão na exportação do Comparator.
 *
 * Categorias preservadas por padrão:
 * - ENDERECO: false (logradouros, números, bairros, CEPs e dados geográficos)
 * - INSCRICAO: false (Inscrição Municipal IM, Inscrição Estadual IE)
 * - OUTRO: false
 *
 * Categorias sanitizadas por padrão:
 * - CPF, CNPJ, NOME, RAZAO_SOCIAL, CONTATO, IDENTIFICADOR_DPS, DOCUMENTO, ASSINATURA, TEXTO_LIVRE: true
 */
export function shouldSanitizeByDefault(category: ComparisonFieldCategory): boolean {
  switch (category) {
    case "ENDERECO":
    case "INSCRICAO":
    case "OUTRO":
      return false;
    case "CPF":
    case "CNPJ":
    case "NOME":
    case "RAZAO_SOCIAL":
    case "CONTATO":
    case "IDENTIFICADOR_DPS":
    case "DOCUMENTO":
    case "ASSINATURA":
    case "TEXTO_LIVRE":
      return true;
    default:
      return false;
  }
}

/**
 * Classifica um campo para fins de exportação de diff/Markdown.
 */
export function classifyExportField(
  fieldName: string
): ExportSensitiveFieldDefinition {
  const directMatch = getExportFieldDefinition(fieldName);
  if (directMatch) {
    return directMatch;
  }

  const normalized = normalizeComparatorField(fieldName);

  if (normalized.endsWith("cpf") || normalized.startsWith("cpf")) {
    return { category: "CPF", suggestedAction: "MASK_TOKEN" };
  }
  if (normalized.endsWith("cnpj") || normalized.startsWith("cnpj")) {
    return { category: "CNPJ", suggestedAction: "MASK_TOKEN" };
  }
  if (normalized.includes("email") || normalized.includes("fone") || normalized.includes("celular")) {
    return { category: "CONTATO", suggestedAction: "MASK_TOKEN" };
  }
  if (normalized.includes("senha") || normalized.includes("token") || normalized.includes("secret")) {
    return { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" };
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
 * Retorna a ação sugerida para um campo no momento da exportação.
 */
export function getExportSuggestedAction(
  fieldName: string
): ExportSanitizationAction {
  return classifyExportField(fieldName).suggestedAction;
}
