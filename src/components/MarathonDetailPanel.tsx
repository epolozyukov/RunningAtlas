import { useEffect, useState } from 'react';
import { ChevronRight, CloudRain, Mountain, Plus, Sparkles, Thermometer, Timer } from 'lucide-react';
import type { DiscoverMarker } from '../types';
import { formatShortDate } from '../utils/raceHelpers';
import { CONTINENT_LABEL, monthName } from '../utils/marathonHelpers';
import { getTypicalWeather, type TypicalWeather } from '../utils/climate';

interface Props {
  marker: DiscoverMarker;
  onSelectRace: (id: string) => void;
  onPlan: () => void;
  /** Omitted on the public site, which hides "Add my result". */
  onAdd?: () => void;
}

const COURSE_LABEL = { flat: 'Flat', rolling: 'Rolling', hilly: 'Hilly' } as const;

function pbVerdict(course: 'flat' | 'rolling' | 'hilly', fast?: boolean, weather?: TypicalWeather | null) {
  const hot = weather && weather.avgHigh >= 24;
  if (fast && !hot) return { label: 'Good for a PB', tone: 'good' };
  if (fast && hot) return { label: 'Fast course, often warm', tone: 'ok' };
  if (course === 'hilly') return { label: 'Tough for a PB', tone: 'hard' };
  return { label: 'Possible, not a classic PB course', tone: 'ok' };
}

function useWeather(lat: number, lng: number, month: number) {
  const [state, setState] = useState<{ data: TypicalWeather | null; loading: boolean }>({ data: null, loading: true });
  useEffect(() => {
    let alive = true;
    setState({ data: null, loading: true });
    getTypicalWeather(lat, lng, month).then(
      (data) => alive && setState({ data, loading: false }),
      () => alive && setState({ data: null, loading: false }),
    );
    return () => {
      alive = false;
    };
  }, [lat, lng, month]);
  return state;
}

const fmtCoord = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? pos : neg}`;

export default function MarathonDetailPanel({ marker, onSelectRace, onPlan, onAdd }: Props) {
  const { marathon: m, myRaces } = marker;
  const done = myRaces.length > 0;
  const weather = useWeather(m.lat, m.lng, m.month);
  const verdict = pbVerdict(m.course, m.fast, weather.data);

  return (
    <article className="marathon-panel">
      <p className="eyebrow">
        {m.city} · {m.country}
      </p>
      <h2 className="panel-title">{m.name}</h2>
      {m.major && <p className="marathon-panel__major">World Marathon Major</p>}

      <p className="race-panel__distance">USUALLY HELD IN</p>
      <p className="marathon-panel__month">{monthName(m.month)}</p>

      <div className="marathon-panel__actions">
        <button type="button" className="btn-journey" onClick={onPlan}>
          <Sparkles size={14} /> Plan this trip
        </button>
        {onAdd && (
          <button type="button" className="btn-ghost marathon-panel__add" onClick={onAdd}>
            <Plus size={14} /> Add my result
          </button>
        )}
      </div>

      <ul className="marathon-panel__facts">
        <li>
          <Mountain size={15} aria-hidden />
          <span>
            <small>Course</small>
            {COURSE_LABEL[m.course]}
          </span>
        </li>
        <li className={`tone-${verdict.tone}`}>
          <Timer size={15} aria-hidden />
          <span>
            <small>PB potential</small>
            {verdict.label}
          </span>
        </li>
        <li>
          <Thermometer size={15} aria-hidden />
          <span>
            <small>Typical {monthName(m.month)}</small>
            {weather.loading ? '…' : weather.data ? `${Math.round(weather.data.avgLow)}–${Math.round(weather.data.avgHigh)} °C` : 'Unavailable'}
          </span>
        </li>
        <li>
          <CloudRain size={15} aria-hidden />
          <span>
            <small>Rain</small>
            {weather.loading ? '…' : weather.data ? `~${weather.data.rainyDays} rainy days` : 'Unavailable'}
          </span>
        </li>
      </ul>
      {weather.data && (
        <p className="marathon-panel__source">
          Weather: daily averages for {monthName(m.month)} {weather.data.years[0]}–{weather.data.years[weather.data.years.length - 1]}, Open-Meteo.
        </p>
      )}

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
