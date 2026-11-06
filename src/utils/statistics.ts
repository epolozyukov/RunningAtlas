import type { Category, Location, Race } from '../types';
import { CATEGORY_ORDER, bestRace, raceSeconds, raceYear } from './raceHelpers';

export interface Stats {
  total: number;
  counts: Record<Category, number>;
  cities: number;
  countries: number;
  totalDistanceKm: number;
  distanceByCategory: Record<Category, number>;
  firstYear: number | null;
  lastYear: number | null;
  yearsActive: number;
  racesPerYear: Record<number, number>;
  marathonAverageSec: number | null;
  marathonAverageSample: number;
  marathonPB: Race | null;
  halfPB: Race | null;
  longest: Race | null;
  firstMarathon: Race | null;
  /** Seconds gained from first marathon to current marathon PB. */
  marathonImprovementSec: number | null;
}

const emptyByCategory = (): Record<Category, number> => ({ marathon: 0, half: 0, ultra: 0 });
const fastest = bestRace;

export function computeStats(list: Race[], locationsById: Record<string, Location>): Stats {
  const counts = emptyByCategory();
  const distanceByCategory = emptyByCategory();
  const cities = new Set<string>();
  const countries = new Set<string>();
  const racesPerYear: Record<number, number> = {};
  let totalDistanceKm = 0;

  for (const r of list) {
    counts[r.category] += 1;
    distanceByCategory[r.category] += r.distanceKm;
    totalDistanceKm += r.distanceKm;
    cities.add(r.locationId);
    const loc = locationsById[r.locationId];
    if (loc) countries.add(loc.country);
    const y = raceYear(r);
    racesPerYear[y] = (racesPerYear[y] ?? 0) + 1;
  }

  const years = Object.keys(racesPerYear).map(Number);
  const firstYear = years.length ? Math.min(...years) : null;
  const lastYear = years.length ? Math.max(...years) : null;

  const marathons = list.filter((r) => r.category === 'marathon');
  // Exclude approximate results (e.g. Vienna 2018) so averages are not misleading.
  const exactMarathonTimes = marathons.map(raceSeconds).filter((s): s is number => s !== null);
  const marathonAverageSec = exactMarathonTimes.length
    ? exactMarathonTimes.reduce((a, b) => a + b, 0) / exactMarathonTimes.length
    : null;

  const marathonPB = fastest(marathons);
  const halfPB = fastest(list.filter((r) => r.category === 'half'));
  const longest = list.reduce<Race | null>((acc, r) => (!acc || r.distanceKm > acc.distanceKm ? r : acc), null);
  const firstMarathon = marathons.find((r) => raceSeconds(r) !== null) ?? null;

  let marathonImprovementSec: number | null = null;
  if (firstMarathon && marathonPB) {
    marathonImprovementSec = (raceSeconds(firstMarathon) ?? 0) - (raceSeconds(marathonPB) ?? 0);
  }

  // Round away floating point noise.
  totalDistanceKm = Math.round(totalDistanceKm * 1000) / 1000;
  for (const c of CATEGORY_ORDER) distanceByCategory[c] = Math.round(distanceByCategory[c] * 1000) / 1000;

  return {
    total: list.length,
    counts,
    cities: cities.size,
    countries: countries.size,
    totalDistanceKm,
    distanceByCategory,
    firstYear,
    lastYear,
    yearsActive: firstYear !== null && lastYear !== null ? lastYear - firstYear + 1 : 0,
    racesPerYear,
    marathonAverageSec,
    marathonAverageSample: exactMarathonTimes.length,
    marathonPB,
    halfPB,
    longest,
    firstMarathon,
    marathonImprovementSec,
  };
}
