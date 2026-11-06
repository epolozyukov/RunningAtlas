import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import type { Location, Race } from '../types';
import { CATEGORY_META, formatDistance, formatLongDate } from '../utils/raceHelpers';

interface Props {
  races: Race[];
  index: number;
  playing: boolean;
  locationsById: Record<string, Location>;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
}

export default function JourneyPlayback({ races, index, playing, locationsById, onTogglePlay, onPrev, onNext, onExit }: Props) {
  const race = races[index];
  const loc = locationsById[race.locationId];
  const meta = CATEGORY_META[race.category];
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="journey" role="region" aria-label="Play my journey" style={{ ['--cat' as string]: meta.color }}>
      <div className="journey__progress" aria-hidden>
        <span style={{ width: `${((index + 1) / races.length) * 100}%` }} />
      </div>
      <div className="journey__card" key={race.id} aria-live="polite">
        <p className="journey__step">
          {pad(index + 1)} <span>/ {pad(races.length)}</span>
        </p>
        <p className="eyebrow">
          <i className="cat-dot" /> {meta.label} · {formatLongDate(race.date)}
        </p>
        <h3 className="journey__city">
          {loc.city}
          <span>{loc.country}</span>
        </h3>
        <p className="journey__event">{race.name}</p>
        <p className="journey__result">
          <span>{formatDistance(race.distanceKm)}</span>
          <strong className={race.approximate ? 'is-approx' : ''}>{race.result}</strong>
          {race.pb && <span className="pb-tag">PB</span>}
        </p>
      </div>
      <div className="journey__controls">
        <button type="button" onClick={onPrev} disabled={index === 0} aria-label="Previous race">
          <ChevronLeft size={18} />
        </button>
        <button type="button" className="is-primary" onClick={onTogglePlay} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button type="button" onClick={onNext} disabled={index === races.length - 1} aria-label="Next race">
          <ChevronRight size={18} />
        </button>
        <button type="button" onClick={onExit} aria-label="Exit journey" className="journey__exit">
          <X size={16} /> <span>Exit</span>
        </button>
      </div>
    </div>
  );
}
