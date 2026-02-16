/**
 * Formatação para exibição (máscaras) — somente visualização no front.
 * Não altera o valor armazenado nem inputs de formulário.
 */

function onlyDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/** CPF formatado para exibição: 000.000.000-00. Retorna string vazia se não tiver 11 dígitos. */
export function formatCpf(value: string | null | undefined): string {
  const d = onlyDigits(value);
  if (d.length !== 11) return (value ?? "").trim() || "";
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** CNPJ formatado para exibição: 00.000.000/0000-00. Retorna string vazia se não tiver 14 dígitos. */
export function formatCnpj(value: string | null | undefined): string {
  const d = onlyDigits(value);
  if (d.length !== 14) return (value ?? "").trim() || "";
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Aplica máscara de CPF no input enquanto digita (até 11 dígitos). */
export function maskCpfInput(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Aplica máscara de CNPJ no input enquanto digita (até 14 dígitos). */
export function maskCnpjInput(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}
