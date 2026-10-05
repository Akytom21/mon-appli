/* Durée des RDV d'interprétation (minutes).
   Les RDV créés avant l'ajout de la durée n'ont pas de durationMin. */

export const DURATION_OPTIONS = [30, 60, 90, 120, 180] as const;
export const DEFAULT_DURATION = 60;

/* 90 → "1 h 30" ; 30 → "30 min" */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

/* "10:30" + 90 → "10:30 – 12:00" ; sans durée → "10:30" */
export function formatTimeRange(time: string, durationMin?: number | null): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match || !durationMin) return time;
  const end = Number(match[1]) * 60 + Number(match[2]) + durationMin;
  const hh = String(Math.floor(end / 60) % 24).padStart(2, '0');
  const mm = String(end % 60).padStart(2, '0');
  return `${time} – ${hh}:${mm}`;
}

/* Montant en centimes : même calcul que functions/src/stripe.ts (priceCents) */
export function priceCents(hourlyRate: number, durationMin: number): number {
  if (!(hourlyRate > 0) || !(durationMin > 0)) return 0;
  return Math.round((hourlyRate * 100 * durationMin) / 60);
}

/* 45 €/h × 90 min → "67,50 € (45 €/h × 1 h 30)" ; sans durée → "45 €/h" */
export function formatPrice(hourlyRate: number, durationMin?: number | null): string {
  const rate = `${String(hourlyRate).replace('.', ',')} €/h`;
  if (!durationMin) return rate;
  const euros = (priceCents(hourlyRate, durationMin) / 100).toFixed(2).replace('.', ',');
  return `${euros} € (${rate} × ${formatDuration(durationMin)})`;
}

/* Date du jour au format "YYYY-MM-DD", en heure locale (pas UTC) */
export function localToday(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/* Créneau "HH:MM" déjà passé pour la date donnée (heure locale du téléphone) */
export function isPastSlot(date: string, slot: string, now = new Date()): boolean {
  const today = localToday(now);
  if (date !== today) return date < today;
  const [h, m] = slot.split(':').map(Number);
  return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
}
