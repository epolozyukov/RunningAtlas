import type { Marathon, Race } from '../types';
import { baseRaces, locationIdForMarathon } from '../data';

/**
 * Results added in the app. A static site can't write to the repo, so they're
 * kept in this browser (localStorage) and can be exported as races.json.
 */
const STORAGE_KEY = 'ra:userRaces:v1';

/**
 * Adding, editing and deleting your own results: on for `npm run dev`, off on the public
 * site. Set VITE_ENABLE_EDITING=true at build time to turn it on there too.
 */
export const RESULTS_EDITING: boolean = import.meta.env.DEV || import.meta.env.VITE_ENABLE_EDITING === 'true';

export function loadUserRaces(): Race[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as Race[]) : [];
    return Array.isArray(list) ? list.filter((r) => r && r.id && r.date && r.result) : [];
  } catch {
    return [];
  }
}

export function saveUserRaces(list: Race[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export const isUserRace = (r: Race) => r.id.startsWith('user-');

/** Validate "H:MM:SS" (or "HH:MM:SS"); returns a normalised string or null. */
export function normaliseTime(input: string): string | null {
  const m = input.trim().match(/^(\d{1,2}):([0-5]\d):([0-5]\d)$/);
  if (!m) return null;
  const h = Number(m[1]);
  if (h > 23 || (h === 0 && Number(m[2]) < 1)) return null;
  return `${h}:${m[2]}:${m[3]}`;
}

export function createUserRace(m: Marathon, input: { date: string; result: string; bib?: string; notes?: string }): Race {
  return {
    id: `user-${input.date}-${m.id}-${Date.now().toString(36)}`,
    name: m.name,
    locationId: locationIdForMarathon(m),
    eventId: m.id,
    date: input.date,
    category: 'marathon',
    distanceKm: 42.195,
    result: input.result,
    ...(input.bib?.trim() ? { bib: input.bib.trim() } : {}),
    ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
  };
}

/** races.json content: built-in races plus the ones added here (PB flags are computed, so omitted). */
export function exportRacesJson(userRaces: Race[]): string {
  const all = [...baseRaces, ...userRaces.map(({ id, ...rest }) => ({ id: id.replace(/^user-/, '').replace(/-[a-z0-9]+$/, ''), ...rest }))]
    .map(({ pb: _pb, ...r }) => r)
    .sort((a, b) => a.date.localeCompare(b.date));
  return '[\n' + all.map((r) => '  ' + JSON.stringify(r)).join(',\n') + '\n]\n';
}

export function downloadFile(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
