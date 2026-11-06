# RUNNING ATLAS
## My Personal Running Journey · 2015–2026

**Product Specification & Development Brief**

---

# 1. Product Vision

Build a beautiful, interactive, single-page website visualizing my personal running history around the world.

The central feature must be a **fully interactive 3D globe of Earth**, displaying all the cities and locations where I have participated in running events.

Imagine opening the website and seeing a beautiful, softly illuminated 3D Earth. Small markers identify the cities where I have raced.

I can:
- Rotate the globe with my mouse or finger.
- Zoom in and out.
- Explore different continents and countries.
- Click on a city to discover my races and results.
- Explore my running history chronologically.
- See my personal records and achievements.

The experience should combine:
- A premium interactive travel atlas.
- A personal sports archive.
- A minimalist editorial website.
- A cinematic 3D geographic visualization.

This is a personal project, not a commercial product.

**Core philosophy: Every dot on this globe represents a race, a place, a moment, and a personal achievement.**

# 2. Design Direction

## Overall aesthetic

The visual design is extremely important.

I want the website to look like a premium digital product, not a generic sports dashboard.

Design inspiration:
- Apple Maps.
- Premium travel magazines.
- National Geographic.
- Arc browser aesthetics.
- Modern editorial websites.
- High-quality 3D Earth visualizations.

Avoid:
- Generic SaaS dashboard layouts.
- Excessive cards.
- Bright gradients.
- Overloaded interfaces.
- Cartoon-style maps.
- Typical fitness application aesthetics.
- Excessive rounded containers.

## Color palette

Use a sophisticated dark theme for the globe experience.

| Element | Color |
|---|---|
| Main background | `#101416` |
| Secondary background | `#171D1F` |
| Globe oceans | Deep muted blue |
| Globe land | Natural muted grey-green |
| Primary text | `#F2F0EA` |
| Secondary text | `#929A98` |
| Marathon markers | `#E8795C` |
| Half marathon markers | `#E2B76A` |
| Ultra / Trail markers | `#829DBB` |
| Personal record accent | `#F2A18A` |

Use subtle atmospheric lighting around the Earth. Markers should be distinctive but restrained.

Typography:
- Inter or Geist for interface elements.
- Instrument Serif or Playfair Display for editorial headings.
- Large, elegant numerical typography for statistics.

Use generous whitespace and strong visual hierarchy.

# 3. Main Experience: Interactive 3D Globe

This is the most important component of the entire application.

The website should open with a beautiful 3D Earth, not a conventional flat map.

## 3.1 Globe appearance

Create a realistic, premium-looking 3D globe.

Requirements:
- Realistic Earth proportions.
- Clearly recognizable continents and coastlines.
- Beautiful geographic details.
- Subtle atmospheric glow.
- Soft lighting and shadows.
- Deep, muted ocean colors.
- Elegant, restrained land colors.
- Clearly visible race markers.

The globe should look sophisticated and immersive.

Avoid overly realistic satellite imagery if it makes the race markers difficult to see.

## 3.2 Globe interactions

Desktop:
- Click and drag to rotate the Earth in any direction.
- Mouse wheel to zoom in and out.
- Double-click a location to zoom into it.
- Click a city marker to explore its races.
- Smooth camera transitions.
- Allow unrestricted rotation around the Earth.

Mobile:
- Swipe with one finger to rotate.
- Pinch with two fingers to zoom.
- Tap city markers.
- Support smooth touch interactions.

The interaction should feel natural, as if holding and rotating a physical globe.

## 3.3 Initial camera position

When the website opens:
- Show the entire globe or a large portion of it.
- Position Europe approximately in the center.
- Make the running locations visible immediately.
- Use a gentle, slow automatic rotation when idle, if it doesn't interfere with interaction.

Europe should be the initial focus because most of my races have taken place there.

## 3.4 Geographic markers

Display all race locations at their actual geographic coordinates.

Use distinct marker colors:
- Marathon: Terracotta / coral.
- Half marathon: Warm gold.
- Ultra / Trail: Muted blue.

Cities with multiple races should be represented by one aggregated marker.

Examples:
- Kraków: 3 marathons.
- Warsaw: 2 marathons.
- Kyiv: Multiple half marathons and ultras.
- Lviv: 2 half marathons.

Markers should be positioned accurately on the globe's surface.

At lower zoom levels:
- Group events by city.
- Display race counts where appropriate.

At higher zoom levels:
- Reveal individual race information.
- Allow selection of individual events.

Special indicators:
- Marathon PB: Warsaw 2026.
- Half marathon PB: Lviv 2018.
- Longest race: Kyiv 100 km.

Personal records should have subtle visual distinction.

## 3.5 Geographic connections

Consider adding optional subtle curved lines connecting race locations.

These lines could represent my running journey across the world.

Examples:
- Almaty → Kyiv → Jerusalem → European cities.
- Chronological connections between locations.

Do not display every connection simultaneously if it makes the globe cluttered.

The visualization should prioritize elegance over complexity.

## 3.6 City interaction

Clicking a city marker should smoothly animate the globe towards that location.

Open an elegant floating information panel.

Example:

**KRAKÓW · POLAND**

**3 RACES**

**CRACOVIA MARATHON**
- April 2024 — 3:57:15
- April 2025 — 3:58:10
- April 2026 — 4:04:58

Display:
- City and country.
- Number of races.
- Best result.
- Distances completed.
- Chronological list of events.

Clicking an individual race should open a detailed race view.

The panel should not obscure the globe unnecessarily.

# 4. Website Layout

The application should be a single-page experience.

## 4.1 Header

Minimal header.

Left:
- RUNNING ATLAS
- My Running Journey

Right:
- Explore
- Race History
- Timeline
- Achievements

Keep navigation compact and elegant.

## 4.2 Hero / Introduction

Small editorial introduction above or alongside the globe.

Example:

**RUNNING ATLAS**

2015 — 2026

"27 races. 12 years. One world to explore."

Display four key statistics:

| Metric | Value |
|---|---:|
| Total races | 27 |
| Marathons | 16 |
| Half marathons | 8 |
| Ultras & Trail | 3 |

Additional calculated statistics:
- Countries visited for races.
- Unique race cities.
- Total race distance.
- Number of years active.

All statistics must be calculated dynamically from the race dataset.

## 4.3 Globe section

The globe should occupy approximately 65–75% of the initial viewport height.

It should be the visual centerpiece.

Place compact filters around the globe without obstructing the experience.

## 4.4 Filters

Provide category filters:
- ALL RACES
- MARATHONS
- HALF MARATHONS
- ULTRAS & TRAIL

Also provide a year filter.

When a filter changes:
- Update the globe markers.
- Update statistics.
- Update race lists.
- Preserve the current globe camera position.

# 5. Race Detail View

Every race should have a consistent detail structure.

Fields:
- Event name.
- City.
- Country.
- Date.
- Distance.
- Category.
- Net time.
- Bib number, if available.
- Personal record flag.
- Additional notes.
- Geographic coordinates.

Example:

**WARSAW MARATHON**

27 September 2026

42.195 KM

**03:35:37 — PERSONAL BEST**

Bib: 16533

For Vienna 2018:
- Display result as `3:49–4:00`.
- Note: Chip did not record the result.
- Treat it as an approximate result, not an exact official time.

All results are net times unless explicitly stated otherwise.

# 6. Running Timeline

Create a beautiful chronological visualization below the globe.

Show years from 2015 to 2026.

Each year should display:
- Number of races.
- Cities visited.
- Race categories.
- Marathon results.

Clicking a year should:
- Highlight corresponding locations on the globe.
- Display the races from that year.
- Allow navigation back to the globe.

A horizontal timeline is preferred.

Keep the design editorial and compact rather than turning it into a conventional analytics chart.

# 7. Personal Records & Highlights

Create a dedicated section with three major achievements.

**MARATHON PERSONAL BEST**

3:35:37

Warsaw · September 2026

**HALF MARATHON PERSONAL BEST**

1:45:49

Lviv · June 2018

**LONGEST SINGLE RACE**

100 KM

Kyiv · July 2020

Use large typography and elegant editorial layouts.

These are highlights, not ordinary dashboard cards.

# 8. European Marathon Classics

Create a dedicated achievement tracker for European Marathon Classics.

Cities claimed:

| City | Status |
|---|---|
| Rome | Completed |
| Copenhagen | Completed |
| Warsaw | Completed |
| Frankfurt | Completed |
| Vienna | Pending |

Display five cities with country labels and completion indicators.

Vienna must be marked as pending, not completed.

Do not assume the 2018 Vienna result has already been accepted by the series.

# 9. Complete Race Dataset

All race information must be stored separately from UI components in structured JSON or JavaScript data.

Do not hardcode race information inside individual components.

## 9.1 Half Marathons — 8

| # | City | Date | Result | Event / Notes |
|---|---|---|---|---|
| 1 | Almaty | Apr 2015 | 2:07:50 | |
| 2 | Kyiv | Apr 2016 | 1:57:10 | Kyiv Half |
| 3 | Kyiv | Oct 2016 | 2:02:03 | Kyiv City Half |
| 4 | Jerusalem | Mar 2017 | 2:04:44 | |
| 5 | Cherkasy | Oct 2017 | 1:49:31 | Nova Poshta |
| 6 | Lviv | Jun 2018 | 1:45:49 | HALF MARATHON PB |
| 7 | Lviv | Jun 2019 | 1:48:18 | |
| 8 | Ivano-Frankivsk | Sep 2019 | 1:56:58 | Frankivsk |

## 9.2 Marathons — 16

| # | City | Date | Result | Event / Notes |
|---|---|---|---|---|
| 1 | Tallinn | Sep 2017 | 4:00:33 | |
| 2 | Valencia | Nov 2017 | 3:51:44 | |
| 3 | Vienna | Apr 2018 | 3:49–4:00 | Chip did not record |
| 4 | Wrocław | Sep 2018 | 3:56:13 | |
| 5 | Brussels | Oct 2018 | 3:57:38 | |
| 6 | Rome | Apr 2019 | 4:03:59 | |
| 7 | Berlin | Sep 2019 | 3:56:01 | Bib 65738 |
| 8 | Frankfurt | Oct 2019 | 4:17:50 | |
| 9 | Istanbul | Nov 2021 | 3:54:35 | |
| 10 | Warsaw | Sep 2022 | 4:00:44 | |
| 11 | Kraków | Apr 2024 | 3:57:15 | Cracovia |
| 12 | Budapest | Oct 2024 | 3:52:48 | |
| 13 | Kraków | Apr 2025 | 3:58:10 | Cracovia |
| 14 | Kraków | Apr 2026 | 4:04:58 | Cracovia |
| 15 | Copenhagen | May 2026 | 3:49:47 | |
| 16 | Warsaw | Sep 2026 | 3:35:37 | MARATHON PB, Bib 16533 |

## 9.3 Ultras & Trail — 3

| # | Event | Location | Date | Distance | Result |
|---|---|---|---|---|---|
| 1 | Kyiv Ultra Marathon | Kyiv, Ukraine | Jul 2020 | 100 km | 11:45:05 |
| 2 | Kyiv Ultramarathon | Kyiv, Ukraine | Jun 2021 | 50 km | 5:05:33 |
| 3 | Pieniny Ultra-Trail — Wielka Prehyba | Pieniny, Poland | Apr 2025 | 44 km | 8:09:12 |

## 9.4 Data rules

- Total: 27 races.
- Store times as strings.
- Parse times only for calculations.
- Preserve original displayed results.
- Vienna 2018 is approximate.
- Do not count multiple races in one city as different cities.
- Keep event names separate from city and country.
- Use correct geographic coordinates.
- Use Kraków as the preferred Polish spelling.
- Use Ivano-Frankivsk as the standardized city name for Frankivsk.
- Use 21.0975 km for half marathons.
- Use 42.195 km for marathons.
- Use actual recorded distances for ultras and trail events.

# 10. Statistics & Calculations

Calculate statistics dynamically.

Initial expected values:

| Statistic | Value |
|---|---:|
| Total races | 27 |
| Marathons | 16 |
| Half marathons | 8 |
| Ultras / Trail | 3 |
| Total race distance | 1,022.7 km |
| Marathon PB | 3:35:37 |
| Half marathon PB | 1:45:49 |
| Longest race | 100 km |

Additional useful statistics:
- Unique cities.
- Unique countries.
- Marathon average time (excluding Vienna's approximate result).
- Number of races per year.
- Marathon improvement between first and latest PB.
- Total distance by category.

Important: Avoid misleading averages by excluding incomplete or approximate times where appropriate.

# 11. Play My Journey — Optional Signature Feature

Consider implementing an interactive storytelling mode.

A button called:

**PLAY MY JOURNEY**

When activated:
1. Start at Almaty, April 2015.
2. Move through my races chronologically.
3. Animate the globe camera towards each new location.
4. Reveal each race marker.
5. Show a small overlay containing city, event, year, distance and result.
6. Continue until Warsaw, September 2026.

The experience should feel like watching a personal travel documentary.

Controls:
- Play.
- Pause.
- Next race.
- Previous race.
- Exit.

Use smooth camera transitions.

This is a secondary feature. Prioritize the core globe and race exploration first.

# 12. Technical Architecture

Keep the implementation deliberately simple.

## Recommended stack

- React.
- TypeScript.
- Vite.
- Globe.gl.
- Three.js (through Globe.gl).
- CSS3.
- JSON for race data.
- Lucide icons, if necessary.

## Globe technology

Preferred: **Globe.gl**.

It already provides:
- 3D Earth rendering.
- WebGL support.
- Geographic markers.
- Interactive rotation.
- Zooming.
- Geographic arcs.
- Camera controls.

Use Three.js directly only if additional customization is needed.

CesiumJS is not necessary for this project.

## Project structure

```text
src/
  components/
    Header
    HeroStats
    GlobeView
    GlobeMarkers
    CityDetailPanel
    RaceDetailPanel
    MapFilters
    RunningTimeline
    PersonalRecords
    EuropeanClassics
    JourneyPlayback

  data/
    races.json
    locations.json

  utils/
    statistics.ts
    raceHelpers.ts
    geographicHelpers.ts

  styles/
    global.css
    globe.css
    components.css

  App.tsx
```

## Data architecture

Use two separate datasets:

**races.json:** Contains individual race records.

**locations.json:** Contains unique geographic locations and coordinates.

Link races to locations using a stable location ID.

This ensures multiple races in the same city share the same geographic marker.

## Deployment

No backend required.

No database required.

No authentication required.

The website should be completely static and deployable to:
- Vercel.
- Netlify.
- GitHub Pages.

Use a suitable public map texture or locally hosted assets to avoid dependence on paid APIs.

# 13. Mobile Experience

Mobile must be supported from the beginning.

Requirements:
- Full-screen or near-full-screen globe.
- Touch rotation and pinch-to-zoom.
- Compact category filters.
- Bottom-sheet city details.
- Responsive race detail panels.
- Horizontally scrollable timeline.
- Touch-friendly controls.

The globe should remain the main attraction on mobile.

# 14. Performance & Accessibility

- Smooth globe rotation and zooming.
- Optimize textures and rendering.
- Avoid unnecessary animations.
- Keep markers responsive.
- Graceful fallback when WebGL is unavailable.
- Respect reduced-motion preferences.
- Ensure text remains readable.
- Support modern desktop and mobile browsers.

# 15. Acceptance Criteria

The project is complete when:

1. All 27 races are included.
2. The application opens with an interactive 3D globe.
3. The globe can be rotated using mouse and touch.
4. Mouse wheel and pinch gestures control zoom.
5. All cities are positioned at accurate geographic coordinates.
6. Multiple races in the same city are grouped.
7. Race categories have distinct marker styles.
8. Clicking a city displays its race history.
9. Individual race details are accessible.
10. Category filters work correctly.
11. Year filtering works correctly.
12. The timeline reflects the complete race history.
13. Personal records are highlighted.
14. European Marathon Classics progress is displayed.
15. Statistics are dynamically calculated.
16. The application is responsive.
17. The application requires no backend.
18. New races can be added through the data files without modifying UI components.
19. The visual design feels premium, polished and intentional.

# 16. Development Approach

Build the project in three stages.

## Stage 1 — Visual Experience

**Priority: Design and the 3D globe.**

- Establish the design system.
- Build the main page.
- Implement the 3D Earth.
- Add sample geographic markers.
- Implement mouse and touch interactions.
- Polish the globe's lighting, colors, markers and camera.
- Ensure the experience looks exceptional before introducing all the data.

## Stage 2 — Data & Functionality

- Integrate all 27 races.
- Add accurate coordinates.
- Implement city aggregation.
- Implement race details.
- Implement filters.
- Implement statistics.
- Add the timeline.
- Add personal records.
- Add European Marathon Classics.

## Stage 3 — Final Polish

- Mobile optimization.
- Smooth animations.
- Camera transitions.
- Optional Play My Journey mode.
- Performance optimization.
- Final visual refinements.
- Deployment.

# 17. Final Design Principle

Do not build a generic running dashboard.

Do not make the globe a small widget surrounded by statistics.

**The globe IS the product.**

Imagine opening RUNNING ATLAS:
- A beautiful 3D Earth appears.
- You see small markers across Europe and beyond.
- You rotate the Earth with your mouse.
- You zoom into Poland and discover Kraków and Warsaw.
- You explore Ukraine and discover Kyiv, Lviv, Cherkasy and Ivano-Frankivsk.
- You rotate towards Asia and discover Almaty.
- You click Warsaw and see your marathon history, including your 3:35:37 personal best.

Everything should feel fluid, immersive and visually intentional.

# RUNNING ATLAS

*27 races. 12 years. One world to explore.*

Every race has a story. This is where they come together.
