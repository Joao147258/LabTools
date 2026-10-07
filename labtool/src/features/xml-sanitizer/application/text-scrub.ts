/**
 * XML Privacy — Text Scrubbing
 *
 * Responsabilidade:
 * Detectar padrões sensíveis conhecidos (e-mail, CNPJ, CPF, telefones)
 * em strings de texto livre (observações, comentários, CDATA e nós mistos)
 * e delegar a substituição determinística para o callback fornecido.
 *
 * O que NÃO faz:
 * - Não manipula nós DOM, XMLDocument ou Elementos;
 * - Não gerencia contadores globais nem estado persistido;
 * - Não realiza chamadas de I/O ou rede;
 * - Não altera tipos fora de strings puras.
 *
 * Pertence exclusivamente à feature: src/features/xml-privacy/
 */

import type { FieldCategory } from "../domain/sanitization.types";

/**
 * Função de callback para gerar o token sintético determinístico.
 */
export type ReplacementCallback = (
  category: FieldCategory,
  originalValue: string
) => string;

/**
 * Expressões regulares para padrões sensíveis em texto livre.
 */
const EMAIL_REGEX =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const FORMATTED_CNPJ_REGEX =
  /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g;

const UNFORMATTED_CNPJ_REGEX =
  /(?<!\d)\d{14}(?!\d)/g;

const FORMATTED_CPF_REGEX =
  /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;

const UNFORMATTED_CPF_REGEX =
  /(?<!\d)\d{11}(?!\d)/g;

const PHONE_REGEX =
  /(?:\+55\s?)?(?:\(?\b\d{2}\)?[\s.-]?)?(?:9\d{4}|\d{4})[-.\s]\d{4}\b|(?:\(\d{2}\)\s?)(?:9\d{4}|\d{4})\d{4}\b/g;

/**
 * Executa o scrub de texto em uma string pura, identificando padrões de PII
 * e substituindo-os pelos tokens gerados por `replace`.
 *
 * A ordem de aplicação é intencional para evitar colisões entre padrões:
 * 1. E-mails (evita que números contidos em domínios/usuários sejam corrompidos)
 * 2. CNPJ (14 dígitos / formatado antes de CPF de 11 dígitos)
 * 3. CPF (11 dígitos / formatado)
 * 4. Telefones brasileiros (formatados com traço/espaço ou DDD entre parênteses)
 */
export function scrubText(
  text: string,
  replace: ReplacementCallback
): string {
  if (!text || typeof text !== "string") {
    return text ?? "";
  }

  let result = text;

  // 1. E-mails
  result = result.replace(EMAIL_REGEX, (match) => replace("CONTATO", match));

  // 2. CNPJ (formatado e não formatado)
  result = result.replace(FORMATTED_CNPJ_REGEX, (match) => replace("CNPJ", match));
  result = result.replace(UNFORMATTED_CNPJ_REGEX, (match) => replace("CNPJ", match));

  // 3. CPF (formatado e não formatado)
  result = result.replace(FORMATTED_CPF_REGEX, (match) => replace("CPF", match));
  result = result.replace(UNFORMATTED_CPF_REGEX, (match) => replace("CPF", match));

  // 4. Telefones
  result = result.replace(PHONE_REGEX, (match) => replace("CONTATO", match));

  return result;
}
