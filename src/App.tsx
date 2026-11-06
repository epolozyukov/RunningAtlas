import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Minus, Plus, Route, Play, X } from 'lucide-react';
import { classics, locationsById, races } from './data';
import type { Filters } from './types';
import { applyFilters, CATEGORY_META, yearsOf } from './utils/raceHelpers';
import { computeStats } from './utils/statistics';
import { aggregateByCity, buildJourneyArcs, framedPointOfView, hasWebGL, haversineKm } from './utils/geographicHelpers';
import Header from './components/Header';
import HeroStats from './components/HeroStats';
import type { GlobeHandle, ZoomBucket } from './components/GlobeView';
import MapFilters from './components/MapFilters';
import CityDetailPanel from './components/CityDetailPanel';
import RaceDetailPanel from './components/RaceDetailPanel';
import RaceHistory from './components/RaceHistory';
import RunningTimeline from './components/RunningTimeline';
import PersonalRecords from './components/PersonalRecords';
import EuropeanClassics from './components/EuropeanClassics';
import JourneyPlayback from './components/JourneyPlayback';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

// The WebGL globe (three.js + globe.gl) is code-split so the page paints instantly.
const GlobeView = lazy(() => import('./components/GlobeView'));

const JOURNEY_STEP_MS = 4200;
const ALL_YEARS = yearsOf(races);
const OVERALL = computeStats(races, locationsById);

export default function App() {
  const [filters, setFilters] = useState<Filters>({ category: 'all', year: 'all' });
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [journey, setJourney] = useState<{ index: number; playing: boolean } | null>(null);
  const [zoom, setZoom] = useState<ZoomBucket>('far');

  const isMobile = useMediaQuery('(max-width: 760px)');
  const isWide = useMediaQuery('(min-width: 1100px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const webgl = useMemo(hasWebGL, []);
  const globeRef = useRef<GlobeHandle>(null);

  // ── Derived data ───────────────────────────────────────────────────
  const filteredRaces = useMemo(() => applyFilters(races, filters), [filters]);
  const stats = useMemo(() => computeStats(filteredRaces, locationsById), [filteredRaces]);
  const isFiltered = filters.category !== 'all' || filters.year !== 'all';

  const journeyRaces = journey ? races.slice(0, journey.index + 1) : null;
  const markers = useMemo(
    () => aggregateByCity(journeyRaces ?? filteredRaces, locationsById),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredRaces, journey?.index, !!journey],
  );
  const arcs = useMemo(() => {
    if (journeyRaces) return buildJourneyArcs(journeyRaces, locationsById);
    return showRoute ? buildJourneyArcs(filteredRaces, locationsById) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRaces, showRoute, journey?.index, !!journey]);

  const filterSummary = isFiltered
    ? [filters.category !== 'all' ? CATEGORY_META[filters.category].plural : null, filters.year !== 'all' ? String(filters.year) : null]
        .filter(Boolean)
        .join(' · ')
    : null;

  // ── Camera helpers ─────────────────────────────────────────────────
  const focusLocation = useCallback(
    (locationId: string, altitude?: number) => {
      const loc = locationsById[locationId];
      const g = globeRef.current;
      if (!loc || !g) return;
      const alt = altitude ?? Math.min(g.getAltitude(), 1.05);
      const pov = framedPointOfView(loc.lat, loc.lng, alt, isMobile);
      g.flyTo(pov.lat, pov.lng, pov.altitude, 1300);
    },
    [isMobile],
  );

  const scrollToGlobe = useCallback(() => {
    document.getElementById('explore')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [reducedMotion]);

  // ── Selection ──────────────────────────────────────────────────────
  const selectCity = useCallback(
    (id: string) => {
      if (journey) return;
      setSelectedCityId(id);
      setSelectedRaceId(null);
      focusLocation(id);
    },
    [focusLocation, journey],
  );

  const selectRace = useCallback(
    (id: string, scroll = false) => {
      const race = races.find((r) => r.id === id);
      if (!race) return;
      setJourney(null);
      setSelectedCityId(race.locationId);
      setSelectedRaceId(id);
      if (scroll) scrollToGlobe();
      focusLocation(race.locationId);
    },
    [focusLocation, scrollToGlobe],
  );

  const closePanel = useCallback(() => {
    setSelectedCityId(null);
    setSelectedRaceId(null);
  }, []);

  // ── Journey playback ───────────────────────────────────────────────
  const startJourney = () => {
    closePanel();
    setShowRoute(false);
    scrollToGlobe();
    setJourney({ index: 0, playing: true });
  };

  const prevIndex = useRef<number | null>(null);
  useEffect(() => {
    if (!journey) {
      prevIndex.current = null;
      return;
    }
    const race = races[journey.index];
    const loc = locationsById[race.locationId];
    const prev = prevIndex.current !== null ? locationsById[races[prevIndex.current].locationId] : null;
    prevIndex.current = journey.index;
    const km = prev ? haversineKm(prev, loc) : 3000;
    const ms = Math.min(2600, 1100 + km * 0.45);
    const pov = framedPointOfView(loc.lat, loc.lng, 1.25, true);
    globeRef.current?.flyTo(pov.lat - (isMobile ? 4 : 0), pov.lng, pov.altitude, ms);
  }, [journey?.index, !!journey, isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!journey?.playing) return;
    if (journey.index >= races.length - 1) {
      setJourney((j) => (j ? { ...j, playing: false } : j));
      return;
    }
    const t = window.setTimeout(() => setJourney((j) => (j ? { ...j, index: j.index + 1 } : j)), JOURNEY_STEP_MS);
    return () => window.clearTimeout(t);
  }, [journey]);

  // ── Keyboard ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (journey) setJourney(null);
        else if (selectedRaceId) setSelectedRaceId(null);
        else closePanel();
      }
      if (journey && e.key === 'ArrowRight') setJourney((j) => (j ? { ...j, index: Math.min(j.index + 1, races.length - 1), playing: false } : j));
      if (journey && e.key === 'ArrowLeft') setJourney((j) => (j ? { ...j, index: Math.max(j.index - 1, 0), playing: false } : j));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [journey, selectedRaceId, closePanel]);

  // ── Panel content ──────────────────────────────────────────────────
  const selectedLocation = selectedCityId ? locationsById[selectedCityId] : null;
  const selectedRace = selectedRaceId ? races.find((r) => r.id === selectedRaceId) ?? null : null;
  const allCityRaces = selectedCityId ? races.filter((r) => r.locationId === selectedCityId) : [];
  const filteredCityRaces = allCityRaces.filter((r) => filteredRaces.includes(r));
  const cityRaces = filteredCityRaces.length ? filteredCityRaces : allCityRaces;
  const panelOpen = !!selectedLocation && !journey;

  return (
    <>
      <Header />
      <main>
        <section
          id="explore"
          className={`explore ${panelOpen ? 'has-panel' : ''} ${journey ? 'is-journey' : ''}`}
          data-zoom={zoom}
        >
          <div className="explore__intro">
            <HeroStats stats={stats} overall={OVERALL} filtered={isFiltered} />
          </div>

          <div className="explore__globe">
            {webgl ? (
              <Suspense fallback={<div className="globe-loading" aria-label="Loading globe" />}>
              <GlobeView
                ref={globeRef}
                markers={markers}
                arcs={arcs}
                selectedCityId={journey ? races[journey.index].locationId : selectedCityId}
                autoRotate={!panelOpen && !journey}
                reducedMotion={reducedMotion}
                offsetX={isWide ? 150 : 0}
                onSelectCity={selectCity}
                onSelectRace={(id) => selectRace(id)}
                onZoomChange={setZoom}
              />
              </Suspense>
            ) : (
              <div className="globe-fallback">
                <p className="eyebrow">3D globe unavailable</p>
                <p>Your browser doesn’t support WebGL. Explore the race cities below.</p>
                <div className="globe-fallback__cities">
                  {markers.map((m) => (
                    <button key={m.id} type="button" className="chip" onClick={() => selectCity(m.id)}>
                      {m.location.city} <span className="muted">{m.races.length}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!journey && (
              <div className="globe-ui globe-ui--top">
                <MapFilters filters={filters} years={ALL_YEARS} onChange={setFilters} />
              </div>
            )}

            {!journey && (
              <div className="globe-ui globe-ui--actions">
                <button type="button" className="btn-journey" onClick={startJourney}>
                  <Play size={14} /> Play my journey
                </button>
                <button
                  type="button"
                  className={`btn-icon ${showRoute ? 'is-active' : ''}`}
                  aria-pressed={showRoute}
                  onClick={() => setShowRoute((s) => !s)}
                  title="Show chronological route"
                >
                  <Route size={16} />
                  <span>Route</span>
                </button>
              </div>
            )}

            {webgl && (
              <div className="globe-ui globe-ui--zoom">
                <button type="button" className="btn-icon" aria-label="Zoom in" onClick={() => globeRef.current?.zoomBy(0.65)}>
                  <Plus size={16} />
                </button>
                <button type="button" className="btn-icon" aria-label="Zoom out" onClick={() => globeRef.current?.zoomBy(1.5)}>
                  <Minus size={16} />
                </button>
              </div>
            )}

            {panelOpen && selectedLocation && (
              <aside className="panel" aria-label={`${selectedLocation.city} details`}>
                <div className="panel__bar">
                  {selectedRace ? (
                    <button type="button" className="panel__back" onClick={() => setSelectedRaceId(null)}>
                      <ArrowLeft size={14} /> {selectedLocation.city}
                    </button>
                  ) : (
                    <span className="panel__grip" aria-hidden />
                  )}
                  <button type="button" className="panel__close" onClick={closePanel} aria-label="Close">
                    <X size={16} />
                  </button>
                </div>
                <div className="panel__body" key={selectedRace?.id ?? selectedLocation.id}>
                  {selectedRace ? (
                    <RaceDetailPanel race={selectedRace} location={selectedLocation} />
                  ) : (
                    <CityDetailPanel
                      location={selectedLocation}
                      races={cityRaces}
                      totalInCity={allCityRaces.length}
                      onSelectRace={(id) => setSelectedRaceId(id)}
                    />
                  )}
                </div>
              </aside>
            )}

            {journey && (
              <JourneyPlayback
                races={races}
                index={journey.index}
                playing={journey.playing}
                locationsById={locationsById}
                onTogglePlay={() =>
                  setJourney((j) => (j ? { index: j.index >= races.length - 1 && !j.playing ? 0 : j.index, playing: !j.playing } : j))
                }
                onPrev={() => setJourney((j) => (j ? { index: Math.max(0, j.index - 1), playing: false } : j))}
                onNext={() => setJourney((j) => (j ? { index: Math.min(races.length - 1, j.index + 1), playing: false } : j))}
                onExit={() => setJourney(null)}
              />
            )}
          </div>
        </section>

        <RaceHistory
          races={filteredRaces}
          locationsById={locationsById}
          onSelectRace={(id) => selectRace(id, true)}
          filterSummary={filterSummary}
          onClearFilters={() => setFilters({ category: 'all', year: 'all' })}
        />

        <RunningTimeline
          races={races}
          locationsById={locationsById}
          selectedYear={filters.year}
          onSelectYear={(year) => setFilters((f) => ({ ...f, year }))}
          onSelectRace={(id) => selectRace(id, true)}
          onBackToGlobe={scrollToGlobe}
        />

        <section id="achievements" className="section">
          <header className="section__head">
            <p className="eyebrow">Achievements</p>
            <h2 className="section__title">Personal records</h2>
          </header>
          <PersonalRecords stats={OVERALL} locationsById={locationsById} onSelectRace={(id) => selectRace(id, true)} />
          <EuropeanClassics
            title={classics.title}
            cities={classics.cities}
            locationsById={locationsById}
            races={races}
            onSelectCity={(id) => {
              setFilters({ category: 'all', year: 'all' });
              scrollToGlobe();
              setJourney(null);
              setSelectedCityId(id);
              setSelectedRaceId(null);
              focusLocation(id);
            }}
          />
        </section>
      </main>

      <footer className="site-footer">
        <p className="site-footer__title">Running Atlas</p>
        <p className="site-footer__lede">
          <em>
            {OVERALL.total} races. {OVERALL.yearsActive} years. One world to explore.
          </em>
        </p>
        <p className="muted">Every race has a story. This is where they come together.</p>
      </footer>
    </>
  );
}
