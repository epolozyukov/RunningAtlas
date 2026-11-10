import racesJson from './races.json';
import locationsJson from './locations.json';
import classicsJson from './classics.json';
import marathonsJson from './marathons.json';
import type { ClassicCity, Location, Marathon, Race } from '../types';
import { raceSeconds } from '../utils/raceHelpers';

/**
 * Single entry point for all data. To add a race permanently, append it to
 * races.json (and its city to locations.json if new) — no component changes
 * needed. Results added in the app are merged in via buildDataset().
 */
export const baseRaces: Race[] = racesJson as Race[];

export const baseLocations: Location[] = locationsJson as Location[];

export const classics = classicsJson as { title: string; cities: ClassicCity[] };

/** Discover catalog — well-known marathons worldwide with their typical month. */
export const marathons: Marathon[] = (marathonsJson as Marathon[])
  .slice()
  .sort((a, b) => a.month - b.month || a.name.localeCompare(b.name));

export const marathonsById: Record<string, Marathon> = Object.fromEntries(marathons.map((m) => [m.id, m]));

export interface Dataset {
  races: Race[];
  locationsById: Record<string, Location>;
}

/** Location id for a catalog marathon: reuse an existing city if we have one. */
export function locationIdForMarathon(m: Marathon): string {
  const existing = baseLocations.find((l) => l.city === m.city && l.country === m.country);
  return existing ? existing.id : `ev-${m.id}`;
}

/**
 * Merge built-in and user-added races into one chronological list.
 * - Locations missing from locations.json are derived from the race's catalog event.
 * - PB flags are computed: the fastest exact marathon and half marathon get pb.
 */
export function buildDataset(extraRaces: Race[]): Dataset {
  const locationsById: Record<string, Location> = Object.fromEntries(baseLocations.map((l) => [l.id, l]));
  // Skip added results that are already in races.json (e.g. after exporting and committing).
  const extras = extraRaces.filter((x) => !baseRaces.some((b) => b.eventId && b.eventId === x.eventId && b.date === x.date));
  const all = [...baseRaces, ...extras].map((r) => ({ ...r, pb: false }));

  for (const r of all) {
    if (locationsById[r.locationId]) continue;
    const m = r.eventId ? marathonsById[r.eventId] : undefined;
    if (m) {
      locationsById[r.locationId] = { id: r.locationId, city: m.city, country: m.country, lat: m.lat, lng: m.lng };
    } else if (import.meta.env.DEV) {
      console.error(`[Running Atlas] Race "${r.id}" references unknown location "${r.locationId}"`);
    }
  }

  for (const cat of ['marathon', 'half'] as const) {
    let best: (typeof all)[number] | null = null;
    let bestSec = Infinity;
    for (const r of all) {
      if (r.category !== cat) continue;
      const s = raceSeconds(r);
      if (s !== null && s < bestSec) {
        best = r;
        bestSec = s;
      }
    }
    if (best) best.pb = true;
  }

  const races = all
    .filter((r) => locationsById[r.locationId])
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return { races, locationsById };
}

if (import.meta.env.DEV) {
  for (const r of baseRaces) {
    if (r.eventId && !marathonsById[r.eventId]) {
      console.error(`[Running Atlas] Race "${r.id}" references unknown event "${r.eventId}"`);
    }
  }
}
