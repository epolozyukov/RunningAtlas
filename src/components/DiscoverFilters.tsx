import type { DiscoverFilters as Filters } from '../types';
import { CONTINENTS, MONTHS } from '../utils/marathonHelpers';

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const SHORT: Record<string, string> = {
  europe: 'Europe',
  asia: 'Asia',
  'north-america': 'N. America',
  'south-america': 'S. America',
  africa: 'Africa',
  oceania: 'Oceania',
};

/** Compact filter bar shown over the globe in Discover mode. */
export default function DiscoverFilters({ filters, onChange }: Props) {
  return (
    <div className="filters filters--discover" role="toolbar" aria-label="Filter marathons">
      <div className="filters__group" role="radiogroup" aria-label="Continent">
        <button
          type="button"
          role="radio"
          aria-checked={filters.continent === 'all'}
          className={`chip ${filters.continent === 'all' ? 'is-active' : ''}`}
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
            className={`chip ${filters.continent === c.id ? 'is-active' : ''}`}
            onClick={() => onChange({ ...filters, continent: c.id })}
          >
            {SHORT[c.id]}
          </button>
        ))}
      </div>
      <label className="filters__year">
        <span className="sr-only">Month</span>
        <select
          value={filters.month}
          onChange={(e) => onChange({ ...filters, month: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
        >
          <option value="all">Any month</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label className="filters__year">
        <span className="sr-only">Status</span>
        <select value={filters.status} onChange={(e) => onChange({ ...filters, status: e.target.value as Filters['status'] })}>
          <option value="all">Any status</option>
          <option value="todo">Not yet run</option>
          <option value="done">Completed</option>
        </select>
      </label>
    </div>
  );
}
