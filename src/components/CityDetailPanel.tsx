import { ChevronRight } from 'lucide-react';
import type { Category, Location, Race } from '../types';
import { CATEGORY_META, CATEGORY_ORDER, bestRace, formatShortDate } from '../utils/raceHelpers';

interface Props {
  location: Location;
  races: Race[];
  totalInCity: number;
  onSelectRace: (id: string) => void;
}

/** Group a city's races by event name, preserving chronological order. */
function groupByEvent(list: Race[]) {
  const groups = new Map<string, Race[]>();
  for (const r of list) {
    const g = groups.get(r.name) ?? [];
    g.push(r);
    groups.set(r.name, g);
  }
  return Array.from(groups.entries());
}

export default function CityDetailPanel({ location, races, totalInCity, onSelectRace }: Props) {
  const categories = CATEGORY_ORDER.filter((c) => races.some((r) => r.category === c));
  const totalKm = races.reduce((s, r) => s + r.distanceKm, 0);

  const bestFor = (c: Category) => {
    const list = races.filter((r) => r.category === c);
    if (c === 'ultra') {
      const longest = list.reduce((a, b) => (b.distanceKm > a.distanceKm ? b : a));
      return { value: `${longest.distanceKm} km`, sub: longest.result };
    }
    const best = bestRace(list);
    return best ? { value: best.result, sub: formatShortDate(best.date) } : null;
  };

  return (
    <div className="city-panel">
      <p className="eyebrow">
        {location.city} · {location.country}
      </p>
      <h2 className="panel-title">{location.city}</h2>
      <p className="city-panel__count">
        <strong>{races.length}</strong> {races.length === 1 ? 'race' : 'races'}
        {races.length !== totalInCity && <span className="muted"> · filtered from {totalInCity}</span>}
      </p>

      <dl className="city-panel__facts">
        {categories.map((c) => {
          const b = bestFor(c);
          return (
            b && (
              <div key={c}>
                <dt>
                  <i style={{ background: CATEGORY_META[c].color }} />
                  {c === 'ultra' ? 'Longest' : `Best ${CATEGORY_META[c].label.toLowerCase()}`}
                </dt>
                <dd>
                  {b.value}
                  <span>{b.sub}</span>
                </dd>
              </div>
            )
          );
        })}
        <div>
          <dt>Distance raced</dt>
          <dd>
            {totalKm.toLocaleString('en-US', { maximumFractionDigits: 1 })} km
            <span>{categories.map((c) => CATEGORY_META[c].plural).join(' · ')}</span>
          </dd>
        </div>
      </dl>

      <div className="city-panel__events">
        {groupByEvent(races).map(([name, list]) => (
          <section key={name}>
            <h3>
              <i style={{ background: CATEGORY_META[list[0].category].color }} />
              {name}
            </h3>
            <ul>
              {list.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => onSelectRace(r.id)}>
                    <span className="date">{formatShortDate(r.date)}</span>
                    <span className="rule" aria-hidden />
                    <span className={`time ${r.approximate ? 'is-approx' : ''}`}>{r.result}</span>
                    {r.pb && <span className="pb-tag">PB</span>}
                    <ChevronRight size={14} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
