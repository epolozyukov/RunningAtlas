import { ArrowUp } from 'lucide-react';
import type { Location, Race } from '../types';
import { CATEGORY_META, formatMonth, raceYear } from '../utils/raceHelpers';

interface Props {
  races: Race[];
  locationsById: Record<string, Location>;
  selectedYear: number | 'all';
  onSelectYear: (year: number | 'all') => void;
  onSelectRace: (id: string) => void;
  onBackToGlobe: () => void;
}

export default function RunningTimeline({ races, locationsById, selectedYear, onSelectYear, onSelectRace, onBackToGlobe }: Props) {
  const years = races.map(raceYear);
  const first = Math.min(...years);
  const last = Math.max(...years);
  const span = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const maxCount = Math.max(...span.map((y) => races.filter((r) => raceYear(r) === y).length));
  const yearRaces = selectedYear === 'all' ? [] : races.filter((r) => raceYear(r) === selectedYear);

  return (
    <section id="timeline" className="section">
      <header className="section__head">
        <p className="eyebrow">Timeline</p>
        <h2 className="section__title">
          {first} — {last}
        </h2>
        <p className="section__sub">Select a year to light up its cities on the globe.</p>
      </header>

      <div className="timeline" role="list">
        {span.map((y) => {
          const list = races.filter((r) => raceYear(r) === y);
          const cities = Array.from(new Set(list.map((r) => locationsById[r.locationId]?.city)));
          const marathons = list.filter((r) => r.category === 'marathon');
          const active = selectedYear === y;
          return (
            <div role="listitem" key={y} className={`timeline__year ${list.length === 0 ? 'is-empty' : ''} ${active ? 'is-active' : ''}`}>
              <button
                type="button"
                disabled={list.length === 0}
                aria-pressed={active}
                onClick={() => onSelectYear(active ? 'all' : y)}
              >
                <span className="timeline__bar" style={{ ['--h' as string]: `${(list.length / maxCount) * 100}%` }} aria-hidden />
                <span className="timeline__label">{y}</span>
                <span className="timeline__count">
                  {list.length === 0 ? 'Rest year' : `${list.length} ${list.length === 1 ? 'race' : 'races'}`}
                </span>
                <span className="timeline__dots" aria-hidden>
                  {list.map((r) => (
                    <i key={r.id} style={{ background: CATEGORY_META[r.category].color }} className={r.pb ? 'is-pb' : ''} />
                  ))}
                </span>
                <span className="timeline__cities">{cities.join(' · ')}</span>
                {marathons.length > 0 && (
                  <span className="timeline__results">
                    {marathons.map((r) => (
                      <span key={r.id} className={r.pb ? 'is-pb' : ''}>
                        {r.result}
                      </span>
                    ))}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {yearRaces.length > 0 && (
        <div className="timeline__detail" aria-live="polite">
          <div className="timeline__detail-head">
            <h3>{selectedYear}</h3>
            <button type="button" className="btn-ghost" onClick={onBackToGlobe}>
              <ArrowUp size={14} /> View on globe
            </button>
          </div>
          <ul>
            {yearRaces.map((r) => {
              const loc = locationsById[r.locationId];
              return (
                <li key={r.id}>
                  <button type="button" onClick={() => onSelectRace(r.id)} style={{ ['--cat' as string]: CATEGORY_META[r.category].color }}>
                    <span className="muted">{formatMonth(r.date)}</span>
                    <strong>
                      <i className="cat-dot" /> {loc.city}
                    </strong>
                    <span>{r.name}</span>
                    <span className={`time ${r.approximate ? 'is-approx' : ''}`}>
                      {r.result}
                      {r.pb && <span className="pb-tag">PB</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
