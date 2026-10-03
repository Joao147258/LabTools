/**
 * XML Comparator — Diff Classifier (Semantic & Contextual Classifier)
 *
 * Responsabilidade:
 * Classifica semanticamente as divergências estruturais e de valor detectadas entre dois XMLs,
 * distinguindo diferenças contextuais de identificação/endereço do tomador e identificadores
 * documentais de divergências fiscais/operacionais principais.
 *
 * Princípios e Fronteiras Arquiteturais:
 * - Puramente declarativo e semântico (zero dependências de React, DOM ou parsing textual);
 * - Ordem de precedência rigorosa:
 *   1. Diferença estrutural / tag ausente -> Principal (STRUCTURE_DIFF, ONLY_IN_APPROVED, ONLY_IN_REJECTED);
 *   2. Município / UF / País / Localização fiscal -> Principal (VALUE_DIFF);
 *   3. Escopo Emitente / Prestador -> Principal (VALUE_DIFF);
 *   4. Campo fiscal conhecido / Descrição de serviço -> Principal (VALUE_DIFF);
 *   5. Identificador documental contextual (serie, nDPS, dhEmi, etc.) -> Contextual (CONTEXTUAL_DIFF);
 *   6. Campo cadastral dentro do escopo Tomador / Destinatário -> Contextual (CONTEXTUAL_DIFF);
 *   7. Tag explicitamente relacionada ao tomador -> Contextual (CONTEXTUAL_DIFF);
 *   8. Qualquer outra divergência -> Principal (VALUE_DIFF).
 */

import type { DiffKind } from "../domain";

/**
 * Normaliza um identificador (tag, nome de atributo ou segmento de path) para análise semântica:
 * - Converte para caixa baixa;
 * - Remove prefixos de namespace (ex.: "nfe:toma" -> "toma");
 * - Remove índices posicionais XPath (ex.: "toma[1]" -> "toma");
 * - Remove pontuações e separadores ("_", "-", ".");
 * - Remove espaços em branco redundantes.
 */
export function normalizeTagOrSegment(raw: string): string {
  if (!raw) return "";
  let clean = raw.trim().toLowerCase();

  // Remover índice xpath posicional se presente (ex: tag[1] -> tag)
  clean = clean.replace(/\[\d+\]/g, "");

  // Remover namespace prefix se presente (ex: "nfe:tag" -> "tag")
  const colonIndex = clean.lastIndexOf(":");
  if (colonIndex >= 0) {
    clean = clean.substring(colonIndex + 1);
  }

  // Remover separadores _, -, .
  clean = clean.replace(/[_\-.]/g, "");

  return clean;
}

/**
 * Converte um path estrutural em uma lista de segmentos normalizados.
 * Exemplo: "/NFSe[1]/infDPS[1]/toma[1]/end[1]/xLgr[1]" -> ["nfse", "infdps", "toma", "end", "xlgr"]
 */
export function extractPathSegments(path: string): string[] {
  if (!path) return [];
  return path
    .split("/")
    .map((s) => normalizeTagOrSegment(s))
    .filter(Boolean);
}

/**
 * Conjunto de segmentos que delimitam o escopo do Tomador / Destinatário / Cliente.
 */
export const TOMADOR_SCOPES = new Set([
  "toma",
  "tomador",
  "tomadorservico",
  "dest",
  "destinatario",
  "destinatarioservico",
  "identificacaotomador",
  "tomadorobra",
  "tomaserv",
  "destserv",
  "dadostomador",
  "dadosdestinatario",
]);

/**
 * Conjunto de segmentos que delimitam o escopo do Prestador / Emitente / Fornecedor.
 */
export const PRESTADOR_SCOPES = new Set([
  "emit",
  "emitente",
  "prest",
  "prestador",
  "prestadorservico",
  "identificacaoprestador",
  "dadosemitente",
  "dadosprestador",
  "emitenteservico",
  "rem",
  "remetente",
  "exped",
  "expedidor",
  "receb",
  "recebedor",
]);

/**
 * Informações de localização / jurisdição fiscal que DEVEM permanecer como divergências principais,
 * mesmo quando posicionadas dentro do escopo do tomador ou de blocos de endereço.
 */
export const LOCATION_PRIMARY_FIELDS = new Set([
  "cmun",
  "xmun",
  "municipio",
  "codigomunicipio",
  "codmunicipio",
  "cmunfg",
  "cmunincid",
  "uf",
  "cuf",
  "pais",
  "cpais",
  "xpais",
  "clocprestacao",
  "xlocprestacao",
  "clocincid",
  "xlocincid",
  "clocemi",
  "xlocemi",
  "clocalidadeincid",
  "xlocalidadeincid",
  "xlocend",
  "clocend",
]);

/**
 * Campos fiscais, tributários, de valores, alíquotas e descrições operacionais
 * que SEMPRE configuram divergências principais.
 */
export const FISCAL_PRIMARY_FIELDS = new Set([
  // Tributação e Códigos Fiscais
  "cst",
  "cclasstrib",
  "cindop",
  "ctribnac",
  "ctribmun",
  "cnbs",
  "cfop",
  "ncm",
  "cest",
  "csosn",
  "opsimpnac",
  "regesptrib",
  "tribissqn",
  "tpretissqn",
  "finnfse",
  "inddest",
  "indtottrib",
  "indfinal",
  "indpres",
  "tpemis",
  "tpamb",

  // Valores e Alíquotas
  "vbc",
  "vserv",
  "vissqn",
  "vliq",
  "vtotalret",
  "vbcst",
  "vst",
  "vprod",
  "vnf",
  "vfrete",
  "vseg",
  "vdesc",
  "vii",
  "vipi",
  "vpis",
  "vcofins",
  "voutro",
  "vtottrib",
  "vretcp",
  "vretpis",
  "vretcofins",
  "vretcsll",
  "vretirrf",
  "vretprev",
  "paliqaplic",
  "paliqpis",
  "paliqcofins",
  "pibsuf",
  "pibsmun",
  "pcbs",
  "paliqefetuf",
  "paliqefetmun",
  "paliqefetcbs",
  "piss",
  "predbc",
  "predbcst",
  "pmva",
  "paliq",
  "ucom",
  "qcom",
  "vuncom",
  "utrib",
  "qtrib",
  "vuntrib",

  // Descrições Fiscais e Operacionais de Serviço (Regra 11)
  "xdescserv",
  "xtribnac",
  "xprod",
  "infadic",
  "infcpl",
  "infadfisco",
]);

/**
 * Identificadores técnicos do documento e dados cronológicos/protocolo
 * que configuram divergências contextuais.
 */
export const DOCUMENT_CONTEXTUAL_FIELDS = new Set([
  "serie",
  "ndps",
  "nnfse",
  "ndfse",
  "nrps",
  "nlote",
  "protocolo",
  "nprotocolo",
  "chave",
  "chaveacesso",
  "cverificacao",
  "dhemi",
  "dcompet",
  "dhproc",
  "dhsaient",
  "dhrecbto",
]);

/**
 * Campos cadastrais, de contato e de endereço específico do Tomador / Destinatário.
 */
export const TOMADOR_CADASTRAL_FIELDS = new Set([
  // Documentos
  "cnpj",
  "cpf",
  "cnpjcpf",
  "nif",
  "passaporte",
  "idtomador",
  "codigotomador",
  "id",

  // Nomes
  "xnome",
  "nome",
  "nomecompleto",
  "razaosocial",
  "nomerazaosocial",
  "nomefantasia",
  "xfant",

  // Inscrições
  "im",
  "ie",
  "inscricaomunicipal",
  "inscricaoestadual",

  // Contato
  "fone",
  "telefone",
  "celular",
  "email",
  "xcontato",

  // Endereço
  "cep",
  "codigopostal",
  "xlgr",
  "logradouro",
  "rua",
  "endereco",
  "nro",
  "numero",
  "numeroendereco",
  "xcpl",
  "complemento",
  "xbairro",
  "bairro",
]);

/**
 * Tags cujo próprio nome explicita pertinência cadastral ao tomador/destinatário.
 */
export const EXPLICIT_TOMADOR_TAGS = new Set([
  "cnpjtomador",
  "cpftomador",
  "xnometomador",
  "razaosocialtomador",
  "imtomador",
  "ietomador",
  "emailtomador",
  "fonetomador",
  "telefonetomador",
  "enderecotomador",
  "logradourotomador",
  "numerotomador",
  "complementotomador",
  "bairrotomador",
  "ceptomador",
  "destinatariocnpj",
  "destinatariocpf",
  "destxnome",
  "razaosocialdestinatario",
  "cepdestinatario",
  "emaildestinatario",
]);

/**
 * Contêineres de cabeçalho/documentais cujos atributos Id/id são contextuais.
 */
export const DOCUMENT_ID_CONTAINERS = new Set([
  "infdps",
  "infnfse",
  "infnfe",
  "infcte",
  "infmdfe",
  "infrps",
  "infevento",
  "infdpsrec",
  "infnfserec",
]);

/**
 * Verifica se um caminho estrutural está contido no escopo do Prestador / Emitente.
 */
export function isInsidePrestadorScope(path: string): boolean {
  if (!path) return false;
  const segments = extractPathSegments(path);
  // Avaliar apenas os ancestrais (excluindo a própria tag folha)
  const parentSegments = segments.slice(0, -1);
  return parentSegments.some((seg) => PRESTADOR_SCOPES.has(seg));
}

/**
 * Verifica se um caminho estrutural está contido no escopo do Tomador / Destinatário.
 */
export function isInsideTomadorScope(path: string): boolean {
  if (!path) return false;
  const segments = extractPathSegments(path);
  // Avaliar apenas os ancestrais (excluindo a própria tag folha)
  const parentSegments = segments.slice(0, -1);
  return parentSegments.some((seg) => TOMADOR_SCOPES.has(seg));
}

/**
 * Avalia se uma tag XML e seu caminho posicional configuram uma divergência contextual.
 *
 * Aplica a ordem de precedência rigorosa:
 * 1. Município / UF / País / Localização fiscal -> false (Principal)
 * 2. Escopo Prestador / Emitente -> false (Principal)
 * 3. Campo fiscal conhecido / Descrição de serviço -> false (Principal)
 * 4. Identificador documental contextual (serie, nDPS, dhEmi, etc.) -> true (Contextual)
 * 5. Campo cadastral dentro do escopo Tomador / Destinatário -> true (Contextual)
 * 6. Tag explicitamente vinculada ao tomador -> true (Contextual)
 * 7. Qualquer outra tag -> false (Principal)
 */
export function isContextualTag(tag: string, path: string): boolean {
  const normTag = normalizeTagOrSegment(tag);
  if (!normTag) return false;

  // 1. Município / UF / País / Localização fiscal -> SEMPRE PRINCIPAL
  if (LOCATION_PRIMARY_FIELDS.has(normTag)) {
    return false;
  }

  // 2. Escopo Prestador / Emitente -> SEMPRE PRINCIPAL
  if (isInsidePrestadorScope(path)) {
    return false;
  }

  // 3. Campo fiscal conhecido / Descrição de serviço -> SEMPRE PRINCIPAL
  if (FISCAL_PRIMARY_FIELDS.has(normTag)) {
    return false;
  }

  // 4. Identificador documental contextual (serie, nDPS, nNFSe, dhEmi, etc.) -> CONTEXTUAL
  if (DOCUMENT_CONTEXTUAL_FIELDS.has(normTag)) {
    return true;
  }

  // 5. Campo cadastral dentro do escopo Tomador / Destinatário -> CONTEXTUAL
  if (isInsideTomadorScope(path) && TOMADOR_CADASTRAL_FIELDS.has(normTag)) {
    return true;
  }

  // 6. Tag explicitamente vinculada ao tomador -> CONTEXTUAL
  if (EXPLICIT_TOMADOR_TAGS.has(normTag)) {
    return true;
  }

  // 7. Qualquer outro elemento -> PRINCIPAL
  return false;
}

/**
 * Avalia se um atributo XML configura uma divergência contextual.
 *
 * Atributos como Id/id em contêineres documentais (infDPS, infNFSe, infNFe) são contextuais.
 * Demais atributos (versao, nItem, xmlns, etc.) configuram divergências principais de atributo.
 */
export function isContextualAttribute(
  tag: string,
  attributeName: string,
  path: string
): boolean {
  const normAttr = normalizeTagOrSegment(attributeName);
  const normTag = normalizeTagOrSegment(tag);

  if (normAttr === "id") {
    if (DOCUMENT_ID_CONTAINERS.has(normTag)) {
      return true;
    }
    const segments = extractPathSegments(path);
    const lastSeg = segments[segments.length - 1];
    if (lastSeg && DOCUMENT_ID_CONTAINERS.has(lastSeg)) {
      return true;
    }
  }

  return false;
}

/**
 * Classifica uma divergência de valor de elemento folha em CONTEXTUAL_DIFF ou VALUE_DIFF.
 */
export function classifyValueDiff(tag: string, path: string): DiffKind {
  return isContextualTag(tag, path) ? "CONTEXTUAL_DIFF" : "VALUE_DIFF";
}

/**
 * Classifica uma divergência de atributo em CONTEXTUAL_DIFF ou ATTRIBUTE_DIFF.
 */
export function classifyAttributeDiff(
  tag: string,
  attributeName: string,
  path: string
): DiffKind {
  return isContextualAttribute(tag, attributeName, path)
    ? "CONTEXTUAL_DIFF"
    : "ATTRIBUTE_DIFF";
}
