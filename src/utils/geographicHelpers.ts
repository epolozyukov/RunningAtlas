import type { CityMarker, Location, Race } from '../types';

/** Aggregate races into one marker per location (city). */
export function aggregateByCity(list: Race[], locationsById: Record<string, Location>): CityMarker[] {
  const map = new Map<string, CityMarker>();
  for (const r of list) {
    const location = locationsById[r.locationId];
    if (!location) continue;
    let m = map.get(location.id);
    if (!m) {
      m = { kind: 'city', id: location.id, location, races: [], counts: { marathon: 0, half: 0, ultra: 0 }, hasPB: false };
      map.set(location.id, m);
    }
    m.races.push(r);
    m.counts[r.category] += 1;
    if (r.pb) m.hasPB = true;
  }
  return Array.from(map.values());
}

export interface JourneyArc {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  order: number;
}

/** Chronological connections between consecutive races in different cities. */
export function buildJourneyArcs(chronological: Race[], locationsById: Record<string, Location>): JourneyArc[] {
  const arcs: JourneyArc[] = [];
  for (let i = 1; i < chronological.length; i++) {
    const a = locationsById[chronological[i - 1].locationId];
    const b = locationsById[chronological[i].locationId];
    if (!a || !b || a.id === b.id) continue;
    arcs.push({
      id: `${chronological[i - 1].id}->${chronological[i].id}`,
      startLat: a.lat,
      startLng: a.lng,
      endLat: b.lat,
      endLng: b.lng,
      order: i,
    });
  }
  return arcs;
}

/** Great-circle distance in km (used for adaptive camera transitions). */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Shift the camera target so the focused city is not hidden by the panel:
 * desktop panel sits on the right → move target east; mobile sheet sits at
 * the bottom → move target south.
 */
export function framedPointOfView(lat: number, lng: number, altitude: number, isMobile: boolean) {
  if (isMobile) return { lat: lat - altitude * 9, lng, altitude };
  return { lat, lng: lng + altitude * 14, altitude };
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}
