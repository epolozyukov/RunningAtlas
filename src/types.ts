export type Category = 'marathon' | 'half' | 'ultra';

export interface Race {
  id: string;
  name: string;
  locationId: string;
  /** "YYYY-MM" or "YYYY-MM-DD" — sorts lexicographically. */
  date: string;
  category: Category;
  distanceKm: number;
  /** Displayed result, stored exactly as recorded (net time unless noted). */
  result: string;
  approximate?: boolean;
  bib?: string;
  pb?: boolean;
  notes?: string;
  /** Link to a catalog entry in marathons.json (marks it as completed in Discover). */
  eventId?: string;
}

export type Continent = 'europe' | 'asia' | 'north-america' | 'south-america' | 'africa' | 'oceania';

/** A known marathon from the Discover catalog. Month is the typical month, not a fixed date. */
export interface Marathon {
  id: string;
  name: string;
  city: string;
  country: string;
  continent: Continent;
  lat: number;
  lng: number;
  /** 1–12 */
  month: number;
  /** Abbott World Marathon Major */
  major?: boolean;
  /** General course profile. */
  course: 'flat' | 'rolling' | 'hilly';
  /** Known as a fast, PB-friendly course. */
  fast?: boolean;
}

export interface DiscoverMarker {
  kind: 'discover';
  id: string;
  marathon: Marathon;
  /** My races at this event (empty = not yet run). */
  myRaces: Race[];
}

export interface DiscoverFilters {
  continent: Continent | 'all';
  month: number | 'all';
  status: 'all' | 'todo' | 'done';
  query: string;
}

export interface Location {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  /** Optional display hint for crowded areas. */
  labelPosition?: 'right' | 'left' | 'bottom';
}

export interface CityMarker {
  kind: 'city';
  id: string;
  location: Location;
  races: Race[];
  counts: Record<Category, number>;
  hasPB: boolean;
}

export type GlobeMarker = CityMarker | DiscoverMarker;

export type CategoryFilter = 'all' | Category;

export interface Filters {
  category: CategoryFilter;
  year: number | 'all';
}

export interface ClassicCity {
  locationId: string;
  status: 'completed' | 'pending';
  note?: string;
}
