import type { Location, Race } from '../types';
import { CATEGORY_META, formatLongDate } from '../utils/raceHelpers';

interface Props {
  race: Race;
  location: Location;
}

const fmtCoord = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;

export default function RaceDetailPanel({ race, location }: Props) {
  const meta = CATEGORY_META[race.category];
  const distance =
    race.category === 'ultra' ? `${race.distanceKm} km` : `${race.distanceKm.toLocaleString('en-US', { maximumFractionDigits: 4 })} km`;

  return (
    <article className="race-panel" style={{ ['--cat' as string]: meta.color }}>
      <p className="eyebrow">
        <i className="cat-dot" /> {meta.label}
      </p>
      <h2 className="panel-title">{race.name}</h2>
      <p className="race-panel__date">{formatLongDate(race.date)}</p>

      <p className="race-panel__distance">{distance.toUpperCase()}</p>

      <div className={`race-panel__result ${race.pb ? 'is-pb' : ''}`}>
        <span className="time">{race.result}</span>
        {race.pb && <span className="race-panel__pb">Personal best</span>}
        {race.approximate && <span className="race-panel__approx">Approximate</span>}
      </div>

      <dl className="race-panel__fields">
        <div>
          <dt>City</dt>
          <dd>{location.city}</dd>
        </div>
        <div>
          <dt>Country</dt>
          <dd>{location.country}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{meta.label}</dd>
        </div>
        <div>
          <dt>{race.approximate ? 'Estimated time' : 'Net time'}</dt>
          <dd>{race.result}</dd>
        </div>
        {race.bib && (
          <div>
            <dt>Bib</dt>
            <dd>{race.bib}</dd>
          </div>
        )}
        <div>
          <dt>Coordinates</dt>
          <dd className="mono">
            {fmtCoord(location.lat, 'N', 'S')}, {fmtCoord(location.lng, 'E', 'W')}
          </dd>
        </div>
      </dl>

      {race.notes && <p className="race-panel__notes">{race.notes}</p>}
      {!race.approximate && <p className="race-panel__footnote">All results are net chip times.</p>}
    </article>
  );
}
