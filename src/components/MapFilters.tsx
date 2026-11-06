import type { CategoryFilter, Filters } from '../types';
import { CATEGORY_META } from '../utils/raceHelpers';

interface Props {
  filters: Filters;
  years: number[];
  onChange: (f: Filters) => void;
}

const OPTIONS: { value: CategoryFilter; label: string; short: string }[] = [
  { value: 'all', label: 'All races', short: 'All' },
  { value: 'marathon', label: 'Marathons', short: 'Marathon' },
  { value: 'half', label: 'Half marathons', short: 'Half' },
  { value: 'ultra', label: 'Ultras & Trail', short: 'Ultra' },
];

export default function MapFilters({ filters, years, onChange }: Props) {
  return (
    <div className="filters" role="toolbar" aria-label="Filter races">
      <div className="filters__group" role="radiogroup" aria-label="Category">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={filters.category === o.value}
            className={`chip ${filters.category === o.value ? 'is-active' : ''}`}
            onClick={() => onChange({ ...filters, category: o.value })}
          >
            {o.value !== 'all' && <i style={{ background: CATEGORY_META[o.value].color }} />}
            <span className="chip__long">{o.label}</span>
            <span className="chip__short">{o.short}</span>
          </button>
        ))}
      </div>
      <label className="filters__year">
        <span className="sr-only">Year</span>
        <select
          value={filters.year}
          onChange={(e) => onChange({ ...filters, year: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
        >
          <option value="all">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
