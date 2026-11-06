import { geoEquirectangular, geoGraticule10, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

/**
 * Paints a muted, editorial Earth texture (equirectangular) on a canvas from
 * Natural Earth vector data (world-atlas, bundled locally — no external APIs).
 */
export const EARTH_PALETTE = {
  oceanTop: '#1b2b35',
  oceanMid: '#1f323d',
  oceanBottom: '#18262f',
  land: '#5d6a5f',
  landHighLat: '#69756c',
  ice: '#8a9491',
  border: 'rgba(22, 30, 30, 0.55)',
  coast: 'rgba(214, 226, 214, 0.22)',
  graticule: 'rgba(200, 220, 230, 0.045)',
};

export async function createEarthCanvas(width: number): Promise<HTMLCanvasElement> {
  const topo = (await import('world-atlas/countries-50m.json')).default as unknown as Topology<{
    countries: GeometryCollection;
  }>;

  const height = width / 2;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const projection = geoEquirectangular()
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2])
    .precision(0.1);
  const path = geoPath(projection, ctx);
  const px = width / 4096; // line widths scale with texture size

  // Ocean — a gentle vertical gradient, darker toward the poles.
  const ocean = ctx.createLinearGradient(0, 0, 0, height);
  ocean.addColorStop(0, EARTH_PALETTE.oceanBottom);
  ocean.addColorStop(0.25, EARTH_PALETTE.oceanTop);
  ocean.addColorStop(0.5, EARTH_PALETTE.oceanMid);
  ocean.addColorStop(0.75, EARTH_PALETTE.oceanTop);
  ocean.addColorStop(1, EARTH_PALETTE.oceanBottom);
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, width, height);

  // Graticule — barely-there atlas grid.
  ctx.beginPath();
  path(geoGraticule10());
  ctx.strokeStyle = EARTH_PALETTE.graticule;
  ctx.lineWidth = 1.2 * px;
  ctx.stroke();

  const countries = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>;

  // Land — latitude-tinted grey-green, ice for polar regions.
  const land = ctx.createLinearGradient(0, 0, 0, height);
  land.addColorStop(0, EARTH_PALETTE.landHighLat);
  land.addColorStop(0.3, EARTH_PALETTE.land);
  land.addColorStop(0.7, EARTH_PALETTE.land);
  land.addColorStop(1, EARTH_PALETTE.landHighLat);

  for (const f of countries.features as Feature<Geometry, { name: string }>[]) {
    const isIce = f.id === '010' || f.id === '304'; // Antarctica, Greenland
    ctx.beginPath();
    path(f);
    ctx.fillStyle = isIce ? EARTH_PALETTE.ice : land;
    ctx.fill();
  }

  // Internal country borders.
  ctx.beginPath();
  path(mesh(topo, topo.objects.countries, (a, b) => a !== b));
  ctx.strokeStyle = EARTH_PALETTE.border;
  ctx.lineWidth = 1.4 * px;
  ctx.stroke();

  // Coastlines — a fine light edge that makes continents read crisply.
  ctx.beginPath();
  path(mesh(topo, topo.objects.countries, (a, b) => a === b));
  ctx.strokeStyle = EARTH_PALETTE.coast;
  ctx.lineWidth = 1.6 * px;
  ctx.stroke();

  return canvas;
}
