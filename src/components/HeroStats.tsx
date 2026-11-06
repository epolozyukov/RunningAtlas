import type { Stats } from '../utils/statistics';

interface Props {
  stats: Stats;
  /** Full-history stats, used for the editorial headline. */
  overall: Stats;
  filtered: boolean;
}

const fmtKm = (km: number) => km.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function HeroStats({ stats, overall, filtered }: Props) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <p className="eyebrow">
        {overall.firstYear} — {overall.lastYear}
      </p>
      <h1 id="hero-title" className="hero__title">
        Running Atlas
      </h1>
      <p className="hero__lede">
        {overall.total} races. {overall.yearsActive} years.
        <br />
        <em>One world to explore.</em>
      </p>

      <dl className={`hero__stats ${filtered ? 'is-filtered' : ''}`} aria-live="polite">
        <div>
          <dt>Total races</dt>
          <dd>{stats.total}</dd>
        </div>
        <div>
          <dt>Marathons</dt>
          <dd className="c-marathon">{stats.counts.marathon}</dd>
        </div>
        <div>
          <dt>Half marathons</dt>
          <dd className="c-half">{stats.counts.half}</dd>
        </div>
        <div>
          <dt>Ultras &amp; Trail</dt>
          <dd className="c-ultra">{stats.counts.ultra}</dd>
        </div>
      </dl>

      <dl className="hero__meta">
        <div>
          <dd>{stats.countries}</dd>
          <dt>countries</dt>
        </div>
        <div>
          <dd>{stats.cities}</dd>
          <dt>cities</dt>
        </div>
        <div>
          <dd>{fmtKm(stats.totalDistanceKm)}</dd>
          <dt>km raced</dt>
        </div>
        <div>
          <dd>{stats.yearsActive}</dd>
          <dt>{stats.yearsActive === 1 ? 'year' : 'years'}</dt>
        </div>
      </dl>
    </section>
  );
}
