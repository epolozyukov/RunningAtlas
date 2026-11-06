import { ChevronRight } from 'lucide-react';
import type { DiscoverMarker } from '../types';
import { formatShortDate } from '../utils/raceHelpers';
import { CONTINENT_LABEL, monthName } from '../utils/marathonHelpers';

interface Props {
  marker: DiscoverMarker;
  onSelectRace: (id: string) => void;
}

const fmtCoord = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? pos : neg}`;

export default function MarathonDetailPanel({ marker, onSelectRace }: Props) {
  const { marathon: m, myRaces } = marker;
  const done = myRaces.length > 0;

  return (
    <article className="marathon-panel">
      <p className="eyebrow">
        {m.city} · {m.country}
      </p>
      <h2 className="panel-title">{m.name}</h2>
      {m.major && <p className="marathon-panel__major">World Marathon Major</p>}

      <p className="race-panel__distance">USUALLY HELD IN</p>
      <p className="marathon-panel__month">{monthName(m.month)}</p>

      <dl className="race-panel__fields">
        <div>
          <dt>Continent</dt>
          <dd>{CONTINENT_LABEL[m.continent]}</dd>
        </div>
        <div>
          <dt>Distance</dt>
          <dd>42.195 km</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd className={done ? 'c-marathon' : 'muted'}>{done ? `Completed ×${myRaces.length}` : 'Not yet run'}</dd>
        </div>
        <div>
          <dt>Coordinates</dt>
          <dd className="mono">
            {fmtCoord(m.lat, 'N', 'S')}, {fmtCoord(m.lng, 'E', 'W')}
          </dd>
        </div>
      </dl>

      {done && (
        <div className="city-panel__events">
          <section>
            <h3>
              <i style={{ background: 'var(--marathon)' }} />
              My results
            </h3>
            <ul>
              {myRaces.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => onSelectRace(r.id)}>
                    <span className="date">{formatShortDate(r.date)}</span>
                    <span className="rule" aria-hidden />
                    <span className="time">{r.result}</span>
                    {r.pb && <span className="pb-tag">PB</span>}
                    <ChevronRight size={14} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <p className="race-panel__footnote">
        The month is when the race is usually held. Exact dates change each year, so check the official race website.
      </p>
    </article>
  );
}
