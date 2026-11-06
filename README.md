# Running Atlas

A personal running journey, 2015–2026, on an interactive 3D globe.
React + TypeScript + Vite + Globe.gl (three.js). Fully static, no backend.

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static output in dist/
npm run preview   # serve the production build
```

## Deploy

`dist/` is a plain static site with relative asset paths (`base: './'`), so it works as-is on:

- **Vercel / Netlify** — build command `npm run build`, output directory `dist`.
- **GitHub Pages** — publish the `dist/` folder (works from a project sub-path).

All assets are local: the Earth texture is painted at runtime from bundled Natural Earth
data (`world-atlas`), relief comes from `public/textures/earth-topology.png`, fonts are
self-hosted via Fontsource. No API keys, no external map services.

## Adding a race

Edit data only — no component changes are needed.

1. Append the race to `src/data/races.json`:

   ```json
   {
     "id": "2027-berlin-marathon",
     "name": "Berlin Marathon",
     "locationId": "berlin",
     "date": "2027-09-26",
     "category": "marathon",
     "distanceKm": 42.195,
     "result": "3:29:59",
     "bib": "12345",
     "pb": true
   }
   ```

   - `date`: `YYYY-MM` or `YYYY-MM-DD`.
   - `category`: `marathon` | `half` | `ultra`.
   - `result`: stored as displayed. Set `"approximate": true` for estimates (excluded from averages and PBs).
   - `pb`: display flag for the PB halo. Move it off the old PB race when you set a new one.
     (The Personal Records section always computes the fastest time itself.)

2. If it is a new city, add it to `src/data/locations.json` with `id`, `city`, `country`,
   `lat`, `lng` (optionally `labelPosition: "left" | "bottom"` for crowded areas).

3. European Marathon Classics status lives in `src/data/classics.json`.

## Structure

```
src/
  components/   Header, HeroStats, GlobeView, GlobeMarkers, CityDetailPanel,
                RaceDetailPanel, MapFilters, RaceHistory, RunningTimeline,
                PersonalRecords, EuropeanClassics, JourneyPlayback
  data/         races.json, locations.json, classics.json, index.ts (loader)
  utils/        statistics.ts, raceHelpers.ts, geographicHelpers.ts, earthTexture.ts
  styles/       global.css, globe.css, components.css
  App.tsx
```

## Interaction

- Drag / swipe to rotate · wheel / pinch to zoom · double-click to zoom into a spot.
- Click a city marker for its races; click a race for full detail. `Esc` steps back.
- Zoom in to reveal city names, then per-race chips (clickable).
- **Play my journey** walks through all races chronologically (`←` / `→` to step).
- Respects `prefers-reduced-motion` (no auto-rotation, instant camera moves).
