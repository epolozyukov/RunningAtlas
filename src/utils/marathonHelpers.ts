import type { Continent, DiscoverFilters, DiscoverMarker, Marathon, Race } from '../types';

export const CONTINENTS: { id: Continent; label: string }[] = [
  { id: 'europe', label: 'Europe' },
  { id: 'asia', label: 'Asia' },
  { id: 'north-america', label: 'North America' },
  { id: 'south-america', label: 'South America' },
  { id: 'africa', label: 'Africa' },
  { id: 'oceania', label: 'Oceania' },
];

export const CONTINENT_LABEL = Object.fromEntries(CONTINENTS.map((c) => [c.id, c.label])) as Record<Continent, string>;

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const monthName = (m: number) => MONTHS[m - 1];
export const monthShort = (m: number) => MONTHS[m - 1].slice(0, 3);

export const DEFAULT_DISCOVER_FILTERS: DiscoverFilters = { continent: 'all', month: 'all', status: 'all', query: '' };

/** Build one marker per catalog marathon, attaching the races I've run there. */
export function buildDiscoverMarkers(catalog: Marathon[], myRaces: Race[]): DiscoverMarker[] {
  return catalog.map((marathon) => ({
    kind: 'discover',
    id: marathon.id,
    marathon,
    myRaces: myRaces.filter((r) => r.eventId === marathon.id),
  }));
}

export function applyDiscoverFilters(list: DiscoverMarker[], f: DiscoverFilters): DiscoverMarker[] {
  const q = f.query.trim().toLowerCase();
  return list.filter(({ marathon: m, myRaces }) => {
    if (f.continent !== 'all' && m.continent !== f.continent) return false;
    if (f.month !== 'all' && m.month !== f.month) return false;
    if (f.status === 'done' && myRaces.length === 0) return false;
    if (f.status === 'todo' && myRaces.length > 0) return false;
    if (q && !`${m.name} ${m.city} ${m.country}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function isDiscoverFiltered(f: DiscoverFilters): boolean {
  return f.continent !== 'all' || f.month !== 'all' || f.status !== 'all' || f.query.trim() !== '';
}
