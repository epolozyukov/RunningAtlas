import type { Category, Filters, Race } from '../types';

export const CATEGORY_META: Record<Category, { label: string; plural: string; short: string; color: string }> = {
  marathon: { label: 'Marathon', plural: 'Marathons', short: 'M', color: '#E8795C' },
  half: { label: 'Half marathon', plural: 'Half marathons', short: 'H', color: '#E2B76A' },
  ultra: { label: 'Ultra / Trail', plural: 'Ultras & Trail', short: 'U', color: '#829DBB' },
};

export const CATEGORY_ORDER: Category[] = ['marathon', 'half', 'ultra'];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Parse "H:MM:SS" into seconds. Returns null for approximate / ranged results. */
export function parseTime(result: string, approximate = false): number | null {
  if (approximate || /[–-]/.test(result)) return null;
  const parts = result.split(':').map(Number);
  if (parts.some((p) => Number.isNaN(p))) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

export function raceSeconds(race: Race): number | null {
  return parseTime(race.result, race.approximate);
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export function raceYear(race: Race): number {
  return Number(race.date.slice(0, 4));
}

function dateParts(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return { y, m, d };
}

/** "27 September 2026" or "April 2024" */
export function formatLongDate(date: string): string {
  const { y, m, d } = dateParts(date);
  return d ? `${d} ${MONTHS[m - 1]} ${y}` : `${MONTHS[m - 1]} ${y}`;
}

/** "Apr 2024" */
export function formatShortDate(date: string): string {
  const { y, m } = dateParts(date);
  return `${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

export function formatMonth(date: string): string {
  return MONTHS[dateParts(date).m - 1];
}

export function formatDistance(km: number): string {
  if (Number.isInteger(km)) return `${km} km`;
  return `${km.toLocaleString('en-US', { maximumFractionDigits: 4 })} km`;
}

export function applyFilters(list: Race[], filters: Filters): Race[] {
  return list.filter(
    (r) =>
      (filters.category === 'all' || r.category === filters.category) &&
      (filters.year === 'all' || raceYear(r) === filters.year),
  );
}

/** Best (fastest) exact result among races of one category. */
export function bestRace(list: Race[]): Race | null {
  let best: Race | null = null;
  let bestSec = Infinity;
  for (const r of list) {
    const s = raceSeconds(r);
    if (s !== null && s < bestSec) {
      best = r;
      bestSec = s;
    }
  }
  return best;
}

export function yearsOf(list: Race[]): number[] {
  return Array.from(new Set(list.map(raceYear))).sort((a, b) => a - b);
}
