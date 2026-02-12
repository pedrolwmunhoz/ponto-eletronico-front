/**
 * Converte entre Duration ISO-8601 (PT8H, PT8H30M, PT0S) e formato de exibição HH:mm (ex: 08:00).
 * Permite horas > 23 (ex: 44:00 para carga semanal).
 */
export function durationToHHmm(iso: string): string {
  if (!iso || iso === "PT0S") return "00:00";
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
  if (!hhmm || !hhmm.trim()) return "PT0S";
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
