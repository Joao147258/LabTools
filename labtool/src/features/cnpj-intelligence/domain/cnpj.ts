/**
 * CNPJ Intelligence — CNPJ Domain Operations
 *
 * Funções puras de domínio para normalização, formatação e validação algorítmica de CNPJ.
 * Totalmente isolado de frameworks, React ou dependências externas.
 */

/**
 * Remove todos os caracteres não numéricos de uma string de CNPJ.
 */
export function normalizeCnpj(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

/**
 * Formata uma string de CNPJ em padrão brasileiro: 00.000.000/0000-00.
 * Suporta formatação de CNPJs parciais durante a digitação na UI.
 */
export function formatCnpj(value: string | null | undefined): string {
  if (!value) return "";
  const digits = normalizeCnpj(value).slice(0, 14);

  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Validação algorítmica estrita de CNPJ:
 * 1. Normaliza a entrada;
 * 2. Valida o tamanho exato (14 dígitos);
 * 3. Rejeita sequências com todos os dígitos repetidos (ex: 00000000000000, 11111111111111, etc.);
 * 4. Calcula e compara o primeiro dígito verificador (DV1);
 * 5. Calcula e compara o segundo dígito verificador (DV2).
 */
export function validateCnpj(value: string | null | undefined): boolean {
  if (!value) return false;

  const digits = normalizeCnpj(value);

  // Deve ter exatamente 14 dígitos numéricos
  if (digits.length !== 14) {
    return false;
  }

  // Rejeita sequências de dígitos iguais
  const allSameDigits = /^(\d)\1{13}$/.test(digits);
  if (allSameDigits) {
    return false;
  }

  // Cálculo do primeiro dígito verificador (DV1)
  const weightsFirst = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sumFirst = 0;
  for (let i = 0; i < 12; i++) {
    sumFirst += parseInt(digits[i], 10) * weightsFirst[i];
  }
  const remainderFirst = sumFirst % 11;
  const dv1 = remainderFirst < 2 ? 0 : 11 - remainderFirst;

  if (dv1 !== parseInt(digits[12], 10)) {
    return false;
  }

  // Cálculo do segundo dígito verificador (DV2)
  const weightsSecond = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sumSecond = 0;
  for (let i = 0; i < 13; i++) {
    sumSecond += parseInt(digits[i], 10) * weightsSecond[i];
  }
  const remainderSecond = sumSecond % 11;
  const dv2 = remainderSecond < 2 ? 0 : 11 - remainderSecond;

  if (dv2 !== parseInt(digits[13], 10)) {
    return false;
  }

  return true;
}
