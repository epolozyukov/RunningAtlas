import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Compass, Footprints, Minus, Plus, Route, Play, X } from 'lucide-react';
import { buildDataset, classics, marathons, marathonsById } from './data';
import { createUserRace, downloadFile, exportRacesJson, isUserRace, loadUserRaces, saveUserRaces } from './utils/userRaces';
import type { DiscoverFilters as DiscoverFilterState, Filters, Race } from './types';
import { applyFilters, CATEGORY_META, raceSeconds, yearsOf } from './utils/raceHelpers';
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
import DiscoverFilters from './components/DiscoverFilters';
import DiscoverIntro from './components/DiscoverIntro';
import MarathonDetailPanel from './components/MarathonDetailPanel';
import MarathonExplorer from './components/MarathonExplorer';
import TripPlanner from './components/TripPlanner';
import AddResultForm from './components/AddResultForm';
import { applyDiscoverFilters, buildDiscoverMarkers, DEFAULT_DISCOVER_FILTERS } from './utils/marathonHelpers';

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
type Mode = 'mine' | 'discover';

export default function App() {
  // ── Data: built-in races + results added in this browser ──────────
  const [userRaces, setUserRaces] = useState(loadUserRaces);
  const { races, locationsById } = useMemo(() => buildDataset(userRaces), [userRaces]);
  const ALL_YEARS = useMemo(() => yearsOf(races), [races]);
  const OVERALL = useMemo(() => computeStats(races, locationsById), [races, locationsById]);
  const DISCOVER_ALL = useMemo(() => buildDiscoverMarkers(marathons, races), [races]);
  const RUNNER_CONTEXT = useMemo(
    () =>
      [
        `- Marathon PB ${OVERALL.marathonPB?.result ?? 'n/a'}${OVERALL.marathonPB ? ` (${locationsById[OVERALL.marathonPB.locationId].city}, ${OVERALL.marathonPB.date.slice(0, 4)})` : ''}; half marathon PB ${OVERALL.halfPB?.result ?? 'n/a'}.`,
        `- ${OVERALL.counts.marathon} marathons, ${OVERALL.counts.half} halves and ${OVERALL.counts.ultra} ultras since ${OVERALL.firstYear}; typical marathon around ${OVERALL.marathonAverageSec ? new Date(OVERALL.marathonAverageSec * 1000).toISOString().slice(12, 19) : 'n/a'}.`,
        `- Based in Europe; has raced mostly in Poland, Ukraine and across Europe.`,
      ].join('\n'),
    [OVERALL, locationsById],
  );
  const updateUserRaces = useCallback((next: Race[]) => {
    setUserRaces(next);
    if (!saveUserRaces(next)) console.warn('[Running Atlas] Could not save results in this browser.');
  }, []);
  const [filters, setFilters] = useState<Filters>({ category: 'all', year: 'all' });
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [journey, setJourney] = useState<{ index: number; playing: boolean } | null>(null);
  const [zoom, setZoom] = useState<ZoomBucket>('far');
  const [mode, setMode] = useState<Mode>('mine');
  const [discoverFilters, setDiscoverFilters] = useState<DiscoverFilterState>(DEFAULT_DISCOVER_FILTERS);
  const [selectedMarathonId, setSelectedMarathonId] = useState<string | null>(null);
  /** What the Discover panel shows for the selected marathon. */
  const [marathonView, setMarathonView] = useState<'details' | 'plan' | 'add'>('details');
  const [plannerUsed, setPlannerUsed] = useState(false);
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);
  const plannerOpen = marathonView === 'plan';
  const setPlannerOpen = (open: boolean) => setMarathonView(open ? 'plan' : 'details');

  const isMobile = useMediaQuery('(max-width: 760px)');
  const isWide = useMediaQuery('(min-width: 1100px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const webgl = useMemo(hasWebGL, []);
  const globeRef = useRef<GlobeHandle>(null);

  // ── Derived data ───────────────────────────────────────────────────
  const filteredRaces = useMemo(() => applyFilters(races, filters), [races, filters]);
  const stats = useMemo(() => computeStats(filteredRaces, locationsById), [filteredRaces, locationsById]);
  const isFiltered = filters.category !== 'all' || filters.year !== 'all';

  const journeyRaces = journey ? races.slice(0, journey.index + 1) : null;
  const discoverFiltered = useMemo(() => applyDiscoverFilters(DISCOVER_ALL, discoverFilters), [DISCOVER_ALL, discoverFilters]);
  const isDiscover = mode === 'discover' && !journey;
  const cityMarkers = useMemo(
    () => aggregateByCity(journeyRaces ?? filteredRaces, locationsById),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredRaces, locationsById, journey?.index, !!journey],
  );
  const markers = isDiscover ? discoverFiltered : cityMarkers;
  const arcs = useMemo(() => {
    if (journeyRaces) return buildJourneyArcs(journeyRaces, locationsById);
    if (mode === 'discover') return [];
    return showRoute ? buildJourneyArcs(filteredRaces, locationsById) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRaces, locationsById, showRoute, journey?.index, !!journey, mode]);

  const filterSummary = isFiltered
    ? [filters.category !== 'all' ? CATEGORY_META[filters.category].plural : null, filters.year !== 'all' ? String(filters.year) : null]
        .filter(Boolean)
        .join(' · ')
    : null;

  // ── Camera helpers ─────────────────────────────────────────────────
  const focusPoint = useCallback(
    (lat: number, lng: number, altitude?: number) => {
      const g = globeRef.current;
      if (!g) return;
      const alt = altitude ?? Math.min(g.getAltitude(), 1.05);
      const pov = framedPointOfView(lat, lng, alt, isMobile);
      g.flyTo(pov.lat, pov.lng, pov.altitude, 1300);
    },
    [isMobile],
  );
  const focusLocation = useCallback(
    (locationId: string, altitude?: number) => {
      const loc = locationsById[locationId];
      if (loc) focusPoint(loc.lat, loc.lng, altitude);
    },
    [focusPoint],
  );

  const scrollToGlobe = useCallback(() => {
    document.getElementById('explore')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [reducedMotion]);

  // ── Selection ──────────────────────────────────────────────────────
  const selectMarathon = useCallback(
    (id: string, scroll = false) => {
      const m = marathons.find((x) => x.id === id);
      if (!m) return;
      setJourney(null);
      setMode('discover');
      setSelectedCityId(null);
      setSelectedRaceId(null);
      setSelectedMarathonId(id);
      setPlannerOpen(false);
      setPlannerUsed(false);
      if (scroll) scrollToGlobe();
      focusPoint(m.lat, m.lng);
    },
    [focusPoint, scrollToGlobe],
  );

  const selectCity = useCallback(
    (id: string) => {
      if (journey) return;
      if (mode === 'discover') return selectMarathon(id);
      setSelectedCityId(id);
      setSelectedRaceId(null);
      focusLocation(id);
    },
    [focusLocation, journey, mode, selectMarathon],
  );

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setSelectedCityId(null);
    setSelectedRaceId(null);
    setSelectedMarathonId(null);
  };

  const selectRace = useCallback(
    (id: string, scroll = false) => {
      const race = races.find((r) => r.id === id);
      if (!race) return;
      setJourney(null);
      setMode('mine');
      setSelectedMarathonId(null);
      setSelectedCityId(race.locationId);
      setSelectedRaceId(id);
      if (scroll) scrollToGlobe();
      focusLocation(race.locationId);
    },
    [focusLocation, scrollToGlobe, races],
  );

  const closePanel = useCallback(() => {
    setSelectedCityId(null);
    setSelectedRaceId(null);
    setSelectedMarathonId(null);
    setPlannerOpen(false);
    setPlannerUsed(false);
    setEditingRaceId(null);
  }, []);

  /** Delete a result added in this browser; closes the panel if its city has no races left. */
  const deleteUserRace = (id: string) => {
    const race = races.find((r) => r.id === id);
    updateUserRaces(userRaces.filter((r) => r.id !== id));
    setEditingRaceId(null);
    setSelectedRaceId(null);
    if (race && !races.some((r) => r.locationId === race.locationId && r.id !== id)) closePanel();
  };

  // ── Journey playback ───────────────────────────────────────────────
  const startJourney = () => {
    closePanel();
    setMode('mine');
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
        else if (marathonView !== 'details' && selectedMarathonId) setMarathonView('details');
        else if (editingRaceId) setEditingRaceId(null);
        else if (selectedRaceId) setSelectedRaceId(null);
        else closePanel();
      }
      if (journey && e.key === 'ArrowRight') setJourney((j) => (j ? { ...j, index: Math.min(j.index + 1, races.length - 1), playing: false } : j));
      if (journey && e.key === 'ArrowLeft') setJourney((j) => (j ? { ...j, index: Math.max(j.index - 1, 0), playing: false } : j));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [journey, selectedRaceId, closePanel, marathonView, selectedMarathonId, editingRaceId]);

  // ── Panel content ──────────────────────────────────────────────────
  const selectedLocation = selectedCityId ? locationsById[selectedCityId] : null;
  const selectedRace = selectedRaceId ? races.find((r) => r.id === selectedRaceId) ?? null : null;
  const allCityRaces = selectedCityId ? races.filter((r) => r.locationId === selectedCityId) : [];
  const filteredCityRaces = allCityRaces.filter((r) => filteredRaces.includes(r));
  const cityRaces = filteredCityRaces.length ? filteredCityRaces : allCityRaces;
  const selectedMarathon = isDiscover && selectedMarathonId ? DISCOVER_ALL.find((m) => m.id === selectedMarathonId) ?? null : null;
  const panelOpen = ((!!selectedLocation && !isDiscover) || !!selectedMarathon) && !journey;

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
            {isDiscover ? (
              <DiscoverIntro all={DISCOVER_ALL} filtered={discoverFiltered} />
            ) : (
              <HeroStats stats={stats} overall={OVERALL} filtered={isFiltered} />
            )}
          </div>

          <div className="explore__globe">
            {webgl ? (
              <Suspense fallback={<div className="globe-loading" aria-label="Loading globe" />}>
              <GlobeView
                ref={globeRef}
                markers={markers}
                arcs={arcs}
                selectedCityId={journey ? races[journey.index].locationId : isDiscover ? selectedMarathonId : selectedCityId}
                legend={isDiscover ? 'discover' : 'mine'}
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
                      {m.kind === 'discover' ? m.marathon.city : m.location.city}{' '}
                      <span className="muted">{m.kind === 'discover' ? m.myRaces.length || '' : m.races.length}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!journey && (
              <div className="globe-ui globe-ui--top">
                <div className="mode-switch" role="tablist" aria-label="Globe mode">
                  <button type="button" role="tab" aria-selected={mode === 'mine'} className={mode === 'mine' ? 'is-active' : ''} onClick={() => switchMode('mine')}>
                    <Footprints size={13} /> My races
                  </button>
                  <button type="button" role="tab" aria-selected={mode === 'discover'} className={mode === 'discover' ? 'is-active' : ''} onClick={() => switchMode('discover')}>
                    <Compass size={13} /> Discover &amp; Add
                  </button>
                </div>
                {mode === 'discover' ? (
                  <DiscoverFilters filters={discoverFilters} onChange={setDiscoverFilters} />
                ) : (
                  <MapFilters filters={filters} years={ALL_YEARS} onChange={setFilters} />
                )}
              </div>
            )}

            {!journey && (
              <div className="globe-ui globe-ui--actions">
                <button type="button" className="btn-journey" onClick={startJourney}>
                  <Play size={14} /> Play my journey
                </button>
                {!isDiscover && <button
                  type="button"
                  className={`btn-icon ${showRoute ? 'is-active' : ''}`}
                  aria-pressed={showRoute}
                  onClick={() => setShowRoute((s) => !s)}
                  title="Show chronological route"
                >
                  <Route size={16} />
                  <span>Route</span>
                </button>}
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

            {panelOpen && selectedMarathon && (
              <aside className={`panel ${plannerOpen ? 'panel--wide' : ''}`} aria-label={`${selectedMarathon.marathon.name} details`}>
                <div className="panel__bar">
                  {marathonView !== 'details' ? (
                    <button type="button" className="panel__back" onClick={() => setMarathonView('details')}>
                      <ArrowLeft size={14} /> {selectedMarathon.marathon.name}
                    </button>
                  ) : (
                    <span className="panel__grip" aria-hidden />
                  )}
                  <button type="button" className="panel__close" onClick={closePanel} aria-label="Close">
                    <X size={16} />
                  </button>
                </div>
                {/* The chat stays mounted once opened, so going back to details keeps the conversation. */}
                {plannerUsed && (
                  <div className="panel__body panel__body--chat" hidden={!plannerOpen}>
                    <TripPlanner marker={selectedMarathon} runnerContext={RUNNER_CONTEXT} />
                  </div>
                )}
                {marathonView === 'details' && (
                  <div className="panel__body" key={selectedMarathon.id}>
                    <MarathonDetailPanel
                      marker={selectedMarathon}
                      onSelectRace={(id) => selectRace(id)}
                      onPlan={() => {
                        setMarathonView('plan');
                        setPlannerUsed(true);
                      }}
                      onAdd={() => setMarathonView('add')}
                    />
                  </div>
                )}
                {marathonView === 'add' && (
                  <div className="panel__body" key={`add-${selectedMarathon.id}`}>
                    <AddResultForm
                      marathon={selectedMarathon.marathon}
                      takenDates={selectedMarathon.myRaces.map((r) => r.date)}
                      currentPbSec={OVERALL.marathonPB ? raceSeconds(OVERALL.marathonPB) : null}
                      onSave={(input) => {
                        const race = createUserRace(selectedMarathon.marathon, input);
                        updateUserRaces([...userRaces, race]);
                        return race;
                      }}
                      onView={(id) => selectRace(id)}
                    />
                  </div>
                )}
              </aside>
            )}

            {panelOpen && !selectedMarathon && selectedLocation && (
              <aside className="panel" aria-label={`${selectedLocation.city} details`}>
                <div className="panel__bar">
                  {selectedRace ? (
                    <button type="button" className="panel__back" onClick={() => { setEditingRaceId(null); setSelectedRaceId(null); }}>
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
                    editingRaceId === selectedRace.id && selectedRace.eventId && marathonsById[selectedRace.eventId] ? (
                      <AddResultForm
                        key={`edit-${selectedRace.id}`}
                        marathon={marathonsById[selectedRace.eventId]}
                        initial={selectedRace}
                        takenDates={races.filter((r) => r.eventId === selectedRace.eventId && r.id !== selectedRace.id).map((r) => r.date)}
                        onSave={(input) => {
                          const updated: Race = { ...selectedRace, date: input.date, result: input.result, bib: input.bib.trim() || undefined, notes: input.notes.trim() || undefined };
                          updateUserRaces(userRaces.map((r) => (r.id === updated.id ? { ...updated, pb: undefined } : r)));
                          setEditingRaceId(null);
                          return updated;
                        }}
                        onCancel={() => setEditingRaceId(null)}
                        onDelete={() => deleteUserRace(selectedRace.id)}
                      />
                    ) : (
                      <RaceDetailPanel
                        race={selectedRace}
                        location={selectedLocation}
                        onEdit={isUserRace(selectedRace) ? () => setEditingRaceId(selectedRace.id) : undefined}
                        onDelete={isUserRace(selectedRace) ? () => deleteUserRace(selectedRace.id) : undefined}
                      />
                    )
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
          addedCount={userRaces.length}
          onExport={() => downloadFile('races.json', exportRacesJson(userRaces))}
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
        <MarathonExplorer
          all={DISCOVER_ALL}
          filtered={discoverFiltered}
          filters={discoverFilters}
          onChange={(f) => {
            setDiscoverFilters(f);
            switchMode('discover');
          }}
          onReset={() => setDiscoverFilters(DEFAULT_DISCOVER_FILTERS)}
          onSelect={(id) => selectMarathon(id, true)}
        />
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
