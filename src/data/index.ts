import racesJson from './races.json';
import locationsJson from './locations.json';
import classicsJson from './classics.json';
import marathonsJson from './marathons.json';
import type { ClassicCity, Location, Marathon, Race } from '../types';

/**
 * Single entry point for all data. To add a race, append it to races.json
 * (and its city to locations.json if new) — no component changes needed.
 */
export const races: Race[] = (racesJson as Race[])
  .slice()
  .sort((a, b) => a.date.localeCompare(b.date));

export const locations: Location[] = locationsJson as Location[];

export const locationsById: Record<string, Location> = Object.fromEntries(
  locations.map((l) => [l.id, l]),
);

export const classics = classicsJson as { title: string; cities: ClassicCity[] };

/** Discover catalog — well-known marathons worldwide with their typical month. */
export const marathons: Marathon[] = (marathonsJson as Marathon[])
  .slice()
  .sort((a, b) => a.month - b.month || a.name.localeCompare(b.name));

// Fail loudly in development if a race points to an unknown location.
if (import.meta.env.DEV) {
  for (const r of races) {
    if (!locationsById[r.locationId]) {
      console.error(`[Running Atlas] Race "${r.id}" references unknown location "${r.locationId}"`);
    }
    if (r.eventId && !marathons.some((m) => m.id === r.eventId)) {
      console.error(`[Running Atlas] Race "${r.id}" references unknown event "${r.eventId}"`);
    }
  }
}
