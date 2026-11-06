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
  id: string;
  location: Location;
  races: Race[];
  counts: Record<Category, number>;
  hasPB: boolean;
}

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
