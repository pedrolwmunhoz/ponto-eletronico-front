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

/** PIS/PASEP formatado para exibição: 000.00000.00-0 (11 dígitos). */
export function formatPisPasep(value: string | null | undefined): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length !== 11) return (value ?? "").trim() || "";
  return `${d.slice(0, 3)}.${d.slice(3, 8)}.${d.slice(8, 10)}-${d.slice(10)}`;
}

/** Aplica máscara de PIS/PASEP no input enquanto digita (até 11 dígitos): 000.00000.00-0. */
export function maskPisPasepInput(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 8) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}.${d.slice(3, 8)}.${d.slice(8)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 8)}.${d.slice(8, 10)}-${d.slice(10)}`;
}

/** CEP formatado para exibição: 00000-000. Retorna string vazia se não tiver 8 dígitos. */
export function formatCep(value: string | null | undefined): string {
  const d = onlyDigits(value);
  if (d.length !== 8) return (value ?? "").trim() || "";
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** Aplica máscara de CEP no input enquanto digita (até 8 dígitos). Mesmo padrão do CPF. */
export function maskCepInput(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** Aplica máscara no DDD: apenas dígitos (máx. 5). Mesmo padrão do CPF (só números no input, sem pontuação). */
export function maskDddInput(value: string): string {
  return onlyDigits(value).slice(0, 5);
}

/** Número de telefone formatado para exibição: 99999-9999 (9 dígitos) ou 9999-9999 (8 dígitos). */
export function formatTelefoneNumero(value: string | null | undefined): string {
  const d = onlyDigits(value);
  if (d.length === 9) return `${d.slice(0, 5)}-${d.slice(5)}`;
  if (d.length === 8) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return (value ?? "").trim() || "";
}

/** Aplica máscara no número de telefone enquanto digita: 99999-9999 (até 9 dígitos). Mesmo padrão do CPF. */
export function maskNumeroTelefoneInput(value: string): string {
  const d = onlyDigits(value).slice(0, 9);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** Número do endereço: apenas dígitos, até 9999 (máx. 4 dígitos). */
export function maskNumeroEnderecoInput(value: string): string {
  return onlyDigits(value).slice(0, 4);
}

/** Valor decimal para input (salário etc.): apenas dígitos e no máximo um ponto ou vírgula. */
export function maskDecimalInput(value: string): string {
  const s = (value ?? "").replace(",", ".");
  const allowed = s.replace(/[^\d.]/g, "");
  const parts = allowed.split(".");
  if (parts.length <= 1) return allowed;
  return parts[0] + "." + parts.slice(1).join("");
}

/** Formata número para exibição de salário (BR): 1.500,50. Duas casas decimais. */
export function formatSalarioDisplay(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  const fixed = Number(value).toFixed(2);
  return fixed.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Converte string do input de salário (com máscara BR ou sem) para número. */
export function parseSalarioInput(value: string): number {
  const s = (value ?? "").trim().replace(/\./g, "").replace(",", ".");
  const num = parseFloat(s);
  return Number.isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/** Máscara de salário no input: formata como 1.500,50 enquanto digita (aceita só números e uma vírgula ou ponto). */
export function maskSalarioInput(value: string): string {
  const s = (value ?? "").replace(",", ".");
  const allowed = s.replace(/[^\d.]/g, "");
  const parts = allowed.split(".");
  const intPart = parts[0] ?? "";
  const decPart = parts.slice(1).join("").slice(0, 2);
  if (decPart.length === 0) {
    if (intPart === "") return "";
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + decPart;
}

/** Primeira letra de cada palavra em maiúscula (ex: "pedro munhoz" → "Pedro Munhoz"). Preserva espaços no início e no fim. */
export function formatTitleCase(value: string | null | undefined): string {
  const s = value ?? "";
  const leading = s.match(/^\s*/)?.[0] ?? "";
  const trailing = s.match(/\s*$/)?.[0] ?? "";
  const middle = s.slice(leading.length, s.length - (trailing.length || 0)).trim();
  if (!middle) return s;
  const formatted = middle
    .split(/\s+/)
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ""))
    .join(" ");
  return leading + formatted + trailing;
}
