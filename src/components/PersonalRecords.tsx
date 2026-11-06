import type { Location, Race } from '../types';
import type { Stats } from '../utils/statistics';
import { CATEGORY_META, CATEGORY_ORDER, formatDuration, formatLongDate } from '../utils/raceHelpers';

interface Props {
  stats: Stats;
  locationsById: Record<string, Location>;
  onSelectRace: (id: string) => void;
}

const fmtKm = (km: number) => km.toLocaleString('en-US', { maximumFractionDigits: 1 });

export default function PersonalRecords({ stats, locationsById, onSelectRace }: Props) {
  const records: { label: string; race: Race | null; value: (r: Race) => string }[] = [
    { label: 'Marathon personal best', race: stats.marathonPB, value: (r) => r.result },
    { label: 'Half marathon personal best', race: stats.halfPB, value: (r) => r.result },
    { label: 'Longest single race', race: stats.longest, value: (r) => `${r.distanceKm} km` },
  ];

  return (
    <div className="records">
      {records.map(({ label, race, value }, i) =>
        race ? (
          <button
            type="button"
            className="record"
            key={label}
            onClick={() => onSelectRace(race.id)}
            style={{ ['--cat' as string]: CATEGORY_META[race.category].color }}
          >
            <span className="record__index">0{i + 1}</span>
            <span className="eyebrow">{label}</span>
            <span className="record__value">{value(race).toUpperCase()}</span>
            <span className="record__where">
              {locationsById[race.locationId].city} · {formatLongDate(race.date).replace(/^\d+ /, '')}
            </span>
          </button>
        ) : null,
      )}

      <dl className="numbers">
        {stats.marathonAverageSec !== null && (
          <div>
            <dt>Marathon average</dt>
            <dd>{formatDuration(stats.marathonAverageSec)}</dd>
            <span>across {stats.marathonAverageSample} exact results · approximate times excluded</span>
          </div>
        )}
        {stats.marathonImprovementSec !== null && stats.firstMarathon && stats.marathonPB && (
          <div>
            <dt>Marathon progress</dt>
            <dd>−{formatDuration(stats.marathonImprovementSec)}</dd>
            <span>
              {stats.firstMarathon.result} ({stats.firstMarathon.date.slice(0, 4)}) → {stats.marathonPB.result} (
              {stats.marathonPB.date.slice(0, 4)})
            </span>
          </div>
        )}
        <div>
          <dt>Distance by category</dt>
          <dd>{fmtKm(stats.totalDistanceKm)} km</dd>
          <span className="numbers__split">
            {CATEGORY_ORDER.map((c) => (
              <span key={c}>
                <i style={{ background: CATEGORY_META[c].color }} />
                {fmtKm(stats.distanceByCategory[c])} km
              </span>
            ))}
          </span>
        </div>
        <div>
          <dt>Atlas</dt>
          <dd>
            {stats.cities} <small>cities</small> {stats.countries} <small>countries</small>
          </dd>
          <span>
            over {stats.yearsActive} years, {stats.firstYear}–{stats.lastYear}
          </span>
        </div>
      </dl>
    </div>
  );
}
