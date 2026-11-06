import { Check, Clock } from 'lucide-react';
import type { ClassicCity, Location, Race } from '../types';

interface Props {
  title: string;
  cities: ClassicCity[];
  locationsById: Record<string, Location>;
  races: Race[];
  onSelectCity: (id: string) => void;
}

export default function EuropeanClassics({ title, cities, locationsById, races, onSelectCity }: Props) {
  const done = cities.filter((c) => c.status === 'completed').length;

  return (
    <div className="classics">
      <header className="classics__head">
        <div>
          <p className="eyebrow">Series tracker</p>
          <h3 className="classics__title">{title}</h3>
        </div>
        <p className="classics__progress">
          <strong>{done}</strong>
          <span>/ {cities.length} claimed</span>
        </p>
      </header>

      <div className="classics__bar" aria-hidden>
        {cities.map((c) => (
          <span key={c.locationId} className={c.status === 'completed' ? 'is-done' : ''} />
        ))}
      </div>

      <ol className="classics__list">
        {cities.map((c) => {
          const loc = locationsById[c.locationId];
          const marathons = races.filter((r) => r.locationId === c.locationId && r.category === 'marathon');
          const done = c.status === 'completed';
          return (
            <li key={c.locationId} className={done ? 'is-done' : 'is-pending'}>
              <button type="button" onClick={() => onSelectCity(c.locationId)}>
                <span className="classics__icon" aria-hidden>
                  {done ? <Check size={14} /> : <Clock size={14} />}
                </span>
                <span className="classics__city">
                  {loc.city}
                  <small>{loc.country}</small>
                </span>
                <span className="classics__status">
                  {done ? 'Completed' : 'Pending'}
                  <small>{c.note ?? marathons.map((r) => r.date.slice(0, 4)).join(', ')}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
