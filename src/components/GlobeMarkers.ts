import type { Category, CityMarker, DiscoverMarker } from '../types';
import { CATEGORY_META, CATEGORY_ORDER, formatShortDate } from '../utils/raceHelpers';
import { monthShort } from '../utils/marathonHelpers';

export interface MarkerHandlers {
  onSelectCity: (cityId: string) => void;
  onSelectRace: (raceId: string) => void;
}

/** Conic fill showing the category mix for a city (single color if one category). */
function categoryFill(counts: Record<Category, number>): string {
  const total = CATEGORY_ORDER.reduce((s, c) => s + counts[c], 0);
  const present = CATEGORY_ORDER.filter((c) => counts[c] > 0);
  if (present.length === 1) return CATEGORY_META[present[0]].color;
  let acc = 0;
  const stops = present.map((c) => {
    const start = (acc / total) * 360;
    acc += counts[c];
    const end = (acc / total) * 360;
    return `${CATEGORY_META[c].color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${stops.join(', ')})`;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Builds the DOM element for one aggregated city marker. Zoom-dependent
 * detail (labels, per-race chips) is revealed purely via CSS using the
 * `data-zoom` attribute on the globe stage.
 */
export function createMarkerElement(marker: CityMarker, handlers: MarkerHandlers, labelPosition?: string): HTMLElement {
  const { location, races, counts, hasPB } = marker;
  const count = races.length;

  const root = el('div', 'gm');
  root.dataset.id = marker.id;
  root.dataset.label = labelPosition ?? 'right';
  root.tabIndex = 0;
  root.setAttribute('role', 'button');
  root.setAttribute('aria-label', `${location.city}, ${location.country} — ${count} race${count > 1 ? 's' : ''}`);
  if (hasPB) root.classList.add('gm--pb');
  if (count > 1) root.classList.add('gm--multi');
  root.style.setProperty('--size', `${Math.min(10 + (count - 1) * 2.5, 18)}px`);

  const halo = el('span', 'gm__halo');
  const dot = el('span', 'gm__dot');
  dot.style.background = categoryFill(counts);
  if (count > 1) dot.appendChild(el('span', 'gm__count', String(count)));

  const label = el('span', 'gm__label');
  const name = el('span', 'gm__city', location.city);
  label.appendChild(name);

  const chips = el('span', 'gm__races');
  for (const r of races) {
    const chip = el('button', 'gm__chip');
    chip.type = 'button';
    chip.style.setProperty('--c', CATEGORY_META[r.category].color);
    chip.setAttribute('aria-label', `${r.name}, ${formatShortDate(r.date)}, ${r.result}`);
    chip.appendChild(el('i', ''));
    chip.appendChild(el('span', 'gm__chip-year', `’${r.date.slice(2, 4)}`));
    chip.appendChild(el('span', 'gm__chip-time', r.result));
    if (r.pb) chip.appendChild(el('span', 'gm__chip-pb', 'PB'));
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      handlers.onSelectRace(r.id);
    });
    chips.appendChild(chip);
  }
  label.appendChild(chips);

  root.append(halo, dot, label);

  const select = (e: Event) => {
    e.stopPropagation();
    handlers.onSelectCity(marker.id);
  };
  root.addEventListener('click', select);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(e);
    }
  });
  // Stop the globe from treating marker presses as drags.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());

  return root;
}

/**
 * Marker for a catalog marathon in Discover mode: hollow ring when not yet run,
 * filled coral when completed, a thin gold halo for World Marathon Majors.
 * Reuses the .gm label/zoom CSS (majors behave like multi-race cities at mid zoom).
 */
export function createDiscoverMarkerElement(marker: DiscoverMarker, onSelect: (id: string) => void): HTMLElement {
  const { marathon: m, myRaces } = marker;
  const done = myRaces.length > 0;

  const root = el('div', 'gm gm--discover');
  root.dataset.id = marker.id;
  root.dataset.label = 'right';
  root.tabIndex = 0;
  root.setAttribute('role', 'button');
  root.setAttribute(
    'aria-label',
    `${m.name}, ${m.city}, ${m.country} — usually ${monthShort(m.month)}${done ? ', completed' : ''}`,
  );
  if (done) root.classList.add('gm--done');
  if (m.major) root.classList.add('gm--major', 'gm--multi');
  root.style.setProperty('--size', m.major ? '11px' : '8px');

  const halo = el('span', 'gm__halo');
  const dot = el('span', 'gm__dot');
  if (myRaces.length > 1) dot.appendChild(el('span', 'gm__count', String(myRaces.length)));

  const label = el('span', 'gm__label');
  const name = el('span', 'gm__city', m.city);
  name.appendChild(el('span', 'gm__month', ` · ${monthShort(m.month)}`));
  label.appendChild(name);
  const detail = el('span', 'gm__races');
  detail.appendChild(el('span', 'gm__event', m.name));
  label.appendChild(detail);

  root.append(halo, dot, label);

  const select = (e: Event) => {
    e.stopPropagation();
    onSelect(marker.id);
  };
  root.addEventListener('click', select);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(e);
    }
  });
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  return root;
}
