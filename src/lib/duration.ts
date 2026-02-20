/**
 * Converte entre Duration ISO-8601 (PT8H, PT8H30M, PT0S) e formato de exibição HH:mm (ex: 08:00).
 * Permite horas > 23 (ex: 44:00 para carga semanal).
 */
export function durationToHHmm(iso: string): string {
  if (iso === "" || iso == null) return "";
  if (iso === "PT0S") return "00:00";
  const hMatch = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!hMatch) {
    const onlyM = iso.match(/^PT(\d+)M$/);
    if (onlyM) {
      const min = parseInt(onlyM[1], 10);
      const h = Math.floor(min / 60);
      const m = min % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    return "00:00";
  }
  const hours = parseInt(hMatch[1] ?? "0", 10);
  const minutes = parseInt(hMatch[2] ?? "0", 10);
  const totalM = hours * 60 + minutes;
  const h = Math.floor(totalM / 60);
  const m = totalM % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Converte Duration ISO-8601 (PT8H30M, PT0S) para total de minutos (número).
 */
export function durationToMinutes(iso: string): number {
  if (!iso || iso === "PT0S") return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/i);
  const h = match ? parseInt(match[1] ?? "0", 10) : 0;
  const m = match ? parseInt(match[2] ?? "0", 10) : 0;
  const s = match && match[3] ? parseFloat(match[3]) : 0;
  return h * 60 + m + s / 60;
}

/**
 * Converte HH:mm (ex: 08:00, 44:00, 00:30) para Duration ISO-8601.
 */
export function hhmmToDuration(hhmm: string): string {
  if (hhmm == null || hhmm.trim() === "") return "";
  const parts = hhmm.trim().split(":");
  const h = parseInt(parts[0] ?? "0", 10) || 0;
  const m = parseInt(parts[1] ?? "0", 10) || 0;
  const totalMinutes = h * 60 + m;
  if (totalMinutes === 0) return "PT0S";
  if (totalMinutes < 60) return `PT${totalMinutes}M`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins === 0 ? `PT${hours}H` : `PT${hours}H${mins}M`;
}

const MAX_DURATION_HOURS = 44;
const MAX_CARGA_DIARIA_HOURS = 12;
const MAX_TOLERANCIA_HOURS = 6;

function clampDurationHHmm(hhmm: string, maxHours: number, maxDisplay: string): string {
  const digits = (hhmm ?? "").replace(/\D/g, "").slice(0, 4);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  const formatted = `${digits.slice(0, 2)}:${digits.slice(2)}`;
  if (digits.length < 4) return formatted;
  const h = parseInt(digits.slice(0, 2), 10) || 0;
  const m = parseInt(digits.slice(2), 10) || 0;
  if (h * 60 + m > maxHours * 60) return maxDisplay;
  return formatted;
}

/**
 * Formata o input: só dígitos (máx. 4), insere ":" depois de 2 dígitos.
 * Se estiver completo (4 dígitos) e total > 12h, exibe "12:00" na tela.
 * Use apenas para carga diária.
 */
export function clampDurationHHmmTo12(hhmm: string): string {
  return clampDurationHHmm(hhmm, MAX_CARGA_DIARIA_HOURS, "12:00");
}

/**
 * Formata o input: só dígitos (máx. 4), insere ":" depois de 2 dígitos.
 * Se estiver completo (4 dígitos) e total > 6h, exibe "06:00" na tela.
 * Use apenas para tolerância.
 */
export function clampDurationHHmmTo6(hhmm: string): string {
  return clampDurationHHmm(hhmm, MAX_TOLERANCIA_HOURS, "06:00");
}

/**
 * Formata o input: só dígitos (máx. 4), insere ":" depois de 2 dígitos.
 * Se estiver completo (4 dígitos) e total > 44h, exibe "44:00" na tela.
 * Permite apagar (campo vazio).
 */
export function clampDurationHHmmTo44(hhmm: string): string {
  return clampDurationHHmm(hhmm, MAX_DURATION_HOURS, "44:00");
}
