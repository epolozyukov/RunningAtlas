import type { DiscoverMarker } from '../types';

interface Props {
  all: DiscoverMarker[];
  filtered: DiscoverMarker[];
}

/** Editorial intro shown beside the globe in Discover mode. */
export default function DiscoverIntro({ all, filtered }: Props) {
  const done = filtered.filter((m) => m.myRaces.length > 0).length;
  const countries = new Set(filtered.map((m) => m.marathon.country)).size;
  const majors = filtered.filter((m) => m.marathon.major);
  const majorsDone = majors.filter((m) => m.myRaces.length > 0).length;

  return (
    <section className="hero" aria-labelledby="discover-title">
      <p className="eyebrow">Discover</p>
      <h1 id="discover-title" className="hero__title">
        Where next?
      </h1>
      <p className="hero__lede">
        {all.length} marathons around the world.
        <br />
        <em>Find the next start line.</em>
      </p>

      <dl className="hero__stats" aria-live="polite">
        <div>
          <dt>Marathons</dt>
          <dd>{filtered.length}</dd>
        </div>
        <div>
          <dt>Countries</dt>
          <dd>{countries}</dd>
        </div>
        <div>
          <dt>Completed</dt>
          <dd className="c-marathon">{done}</dd>
        </div>
        <div>
          <dt>Still to run</dt>
          <dd>{filtered.length - done}</dd>
        </div>
      </dl>

      <dl className="hero__meta">
        <div>
          <dd>
            {majorsDone}/{majors.length}
          </dd>
          <dt>World Marathon Majors</dt>
        </div>
      </dl>
    </section>
  );
}
