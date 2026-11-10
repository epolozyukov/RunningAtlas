import type { Location, Race } from '../types';
import { CATEGORY_META, formatShortDate, raceYear } from '../utils/raceHelpers';

interface Props {
  races: Race[];
  locationsById: Record<string, Location>;
  onSelectRace: (id: string) => void;
  filterSummary: string | null;
  onClearFilters: () => void;
  /** Results added in this browser (not yet in races.json). */
  addedCount: number;
  onExport: () => void;
}

export default function RaceHistory({ races, locationsById, onSelectRace, filterSummary, onClearFilters, addedCount, onExport }: Props) {
  const byYear = new Map<number, Race[]>();
  for (const r of [...races].reverse()) {
    const y = raceYear(r);
    byYear.set(y, [...(byYear.get(y) ?? []), r]);
  }

  return (
    <section id="history" className="section">
      <header className="section__head">
        <p className="eyebrow">Race history</p>
        <h2 className="section__title">Every start line</h2>
        <p className="section__sub">
          {races.length} {races.length === 1 ? 'race' : 'races'}
          {filterSummary && (
            <>
              {' '}
              · {filterSummary}{' '}
              <button type="button" className="link" onClick={onClearFilters}>
                Clear filters
              </button>
            </>
          )}
        </p>
      </header>

      {addedCount > 0 && (
        <div className="history__export">
          <p>
            <strong>{addedCount}</strong> {addedCount === 1 ? 'result' : 'results'} added in this browser. To keep{' '}
            {addedCount === 1 ? 'it' : 'them'} for good, download the updated races.json, replace <code>src/data/races.json</code> and commit.
          </p>
          <button type="button" className="btn-ghost" onClick={onExport}>
            Download races.json
          </button>
        </div>
      )}

      {races.length === 0 && <p className="empty">No races match these filters.</p>}

      <div className="history">
        {Array.from(byYear.entries()).map(([year, list]) => (
          <div className="history__year" key={year}>
            <h3>{year}</h3>
            <ol>
              {list.map((r) => {
                const loc = locationsById[r.locationId];
                return (
                  <li key={r.id}>
                    <button type="button" onClick={() => onSelectRace(r.id)} style={{ ['--cat' as string]: CATEGORY_META[r.category].color }}>
                      <span className="h-date">{formatShortDate(r.date).split(' ')[0]}</span>
                      <span className="h-event">
                        <i className="cat-dot" />
                        <span>
                          {r.name}
                          <small>
                            {loc.city}, {loc.country}
                          </small>
                        </span>
                      </span>
                      <span className="h-dist">{r.category === 'ultra' ? `${r.distanceKm} km` : CATEGORY_META[r.category].label}</span>
                      <span className={`h-time ${r.approximate ? 'is-approx' : ''}`}>
                        {r.result}
                        {r.pb && <span className="pb-tag">PB</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
