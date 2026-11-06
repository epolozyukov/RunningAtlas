import { Search } from 'lucide-react';
import type { DiscoverFilters, DiscoverMarker } from '../types';
import { CONTINENTS, CONTINENT_LABEL, MONTHS, isDiscoverFiltered } from '../utils/marathonHelpers';

interface Props {
  all: DiscoverMarker[];
  filtered: DiscoverMarker[];
  filters: DiscoverFilters;
  onChange: (f: DiscoverFilters) => void;
  onReset: () => void;
  onSelect: (id: string) => void;
}

/** Browsable calendar of known marathons, grouped by typical month. */
export default function MarathonExplorer({ all, filtered, filters, onChange, onReset, onSelect }: Props) {
  const doneTotal = all.filter((m) => m.myRaces.length > 0).length;
  const countries = new Set(filtered.map((m) => m.marathon.country)).size;

  return (
    <section id="discover" className="section">
      <header className="section__head">
        <p className="eyebrow">Discover</p>
        <h2 className="section__title">Marathons of the world</h2>
        <p className="section__sub">
          {all.length} well-known marathons, grouped by the month they are usually held. You’ve run{' '}
          <strong className="c-marathon">{doneTotal}</strong> of them.
        </p>
      </header>

      <div className="explorer__controls">
        <div className="explorer__chips" role="radiogroup" aria-label="Continent">
          <button
            type="button"
            role="radio"
            aria-checked={filters.continent === 'all'}
            className={`chip chip--outline ${filters.continent === 'all' ? 'is-active' : ''}`}
            onClick={() => onChange({ ...filters, continent: 'all' })}
          >
            World
          </button>
          {CONTINENTS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={filters.continent === c.id}
              className={`chip chip--outline ${filters.continent === c.id ? 'is-active' : ''}`}
              onClick={() => onChange({ ...filters, continent: c.id })}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="explorer__row">
          <label className="explorer__search">
            <Search size={14} aria-hidden />
            <input
              type="search"
              placeholder="Search city, country or race"
              value={filters.query}
              onChange={(e) => onChange({ ...filters, query: e.target.value })}
            />
          </label>
          <div className="explorer__status" role="radiogroup" aria-label="Status">
            {(
              [
                ['all', 'All'],
                ['todo', 'Not yet run'],
                ['done', 'Completed'],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={filters.status === v}
                className={`chip ${filters.status === v ? 'is-active' : ''}`}
                onClick={() => onChange({ ...filters, status: v })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="explorer__count">
          {filtered.length} {filtered.length === 1 ? 'marathon' : 'marathons'} · {countries} {countries === 1 ? 'country' : 'countries'}
          {isDiscoverFiltered(filters) && (
            <>
              {' · '}
              <button type="button" className="link" onClick={onReset}>
                Reset
              </button>
            </>
          )}
        </p>
      </div>

      {filtered.length === 0 && <p className="empty">No marathons match these filters.</p>}

      <div className="calendar">
        {MONTHS.map((name, i) => {
          const month = i + 1;
          const list = filtered.filter((m) => m.marathon.month === month);
          if (list.length === 0) return null;
          const active = filters.month === month;
          return (
            <div className={`calendar__month ${active ? 'is-active' : ''}`} key={name}>
              <button
                type="button"
                className="calendar__head"
                aria-pressed={active}
                onClick={() => onChange({ ...filters, month: active ? 'all' : month })}
                title={active ? 'Show all months' : `Show only ${name} on the globe`}
              >
                <h3>{name}</h3>
                <span>{list.length}</span>
              </button>
              <ul>
                {list.map(({ id, marathon: m, myRaces }) => (
                  <li key={id}>
                    <button type="button" onClick={() => onSelect(id)} className={myRaces.length ? 'is-done' : ''}>
                      <i className="calendar__dot" aria-hidden />
                      <span className="calendar__name">
                        <span>
                          {m.city}
                          {m.major && <em className="calendar__major">Major</em>}
                        </span>
                        <small>
                          {m.country} · {CONTINENT_LABEL[m.continent]}
                        </small>
                      </span>
                      {myRaces.length > 0 && <span className="calendar__done">{myRaces.map((r) => r.date.slice(2, 4)).map((y) => `’${y}`).join(' ')}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="explorer__note">
        Months are based on recent editions. Exact dates change each year, so check the official race website before you plan.
      </p>
    </section>
  );
}
