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

Hosted on **Vercel** (free Hobby plan). On vercel.com: Add New → Project → import this
GitHub repo → Deploy. `vercel.json` sets the build (`npm run build` → `dist`) and the
security headers (CSP, no framing, nosniff, referrer and permissions policies). Every push
to `main` redeploys automatically.

- No environment variables are needed. Do **not** add `VITE_GROQ_API_KEY` in Vercel.
- Deploy through the GitHub import (Vercel builds from the repo). Avoid local
  `vercel build` / `vercel --prebuilt` uploads.

`dist/` is a plain static site with relative asset paths (`base: './'`), so it also works on
Netlify or GitHub Pages.

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
   - PBs are calculated automatically (fastest exact marathon / half), so no `pb` flag is needed.

2. If it is a new city, add it to `src/data/locations.json` with `id`, `city`, `country`,
   `lat`, `lng` (optionally `labelPosition: "left" | "bottom"` for crowded areas).

3. European Marathon Classics status lives in `src/data/classics.json`.

4. If the race is in the Discover catalog, add `"eventId": "<catalog id>"` to the race so it
   shows as completed there.

## Adding results in the app

Only in `npm run dev`: the public site is read-only (the tab is just "Discover", with no Add,
Edit or Delete). To turn it on in a production build, set `VITE_ENABLE_EDITING=true`.

Discover & Add → click a marathon → **Add my result** (date, net time, optional bib and notes).
The result appears straight away across the globe, history, timeline, stats, PBs and Discover.
It's saved in that browser only (static site, no backend). To make it permanent, use
**Download races.json** in Race History, replace `src/data/races.json` and commit. Results
already present in races.json are ignored if they're still in the browser, so they're never
shown twice. Results added in the browser can be removed from their race panel.

## Discover catalog

`src/data/marathons.json` lists well-known marathons worldwide:
`id`, `name`, `city`, `country`, `continent` (`europe` | `asia` | `north-america` |
`south-america` | `africa` | `oceania`), `lat`, `lng`, `month` (1–12, the month the race is
usually held) and an optional `major: true` for World Marathon Majors. Add or edit entries
freely. Months come from recent editions, so check the official site for exact dates.

Each entry also has `course` (`flat` | `rolling` | `hilly`) and optional `fast: true` for
PB-friendly courses.

## Trip planner (Discover → marathon → Plan this trip)

- Typical race-month weather comes from real observations via the free
  [Open-Meteo](https://open-meteo.com) historical archive (no key needed), averaged over the
  last 3 years and cached in the browser.
- The chat uses free models on [Groq](https://console.groq.com). Each visitor pastes their own
  free Groq API key, which is stored only in their browser (`localStorage`) and sent only to Groq.
  The site owner's key is never used on the public site.
  The production build sets a Content Security Policy that only allows connections to Groq
  and Open-Meteo (see `vite.config.ts`).
- For local development you can put your key in `.env` (copy `.env.example`):
  `VITE_GROQ_API_KEY=gsk_…`, then restart `npm run dev`. It is used by the dev server only;
  production builds never include it, so a deployed site can't leak it. A key saved in the
  browser takes priority. `.env` is git-ignored.
- Budgets and travel details are AI estimates, not live prices.

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
