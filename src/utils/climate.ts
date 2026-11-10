/**
 * Typical race-month weather from real observations (Open-Meteo historical
 * archive — free, no API key, CORS-enabled). Averages the given month over
 * the last few complete years.
 */
export interface TypicalWeather {
  month: number;
  years: number[];
  avgHigh: number;
  avgLow: number;
  /** Average number of days per month with ≥ 1 mm of rain. */
  rainyDays: number;
  /** Average monthly precipitation, mm. */
  precipitation: number;
}

const YEARS_BACK = 3;
const CACHE_PREFIX = 'ra:weather:v1:';
const memory = new Map<string, Promise<TypicalWeather>>();

const round1 = (n: number) => Math.round(n * 10) / 10;

export function getTypicalWeather(lat: number, lng: number, month: number): Promise<TypicalWeather> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)},${month}`;
  const cached = memory.get(key);
  if (cached) return cached;

  try {
    const stored = localStorage.getItem(CACHE_PREFIX + key);
    if (stored) {
      const value = JSON.parse(stored) as TypicalWeather;
      const p = Promise.resolve(value);
      memory.set(key, p);
      return p;
    }
  } catch {
    /* storage unavailable — fetch instead */
  }

  const p = fetchWeather(lat, lng, month);
  memory.set(key, p);
  p.then(
    (v) => {
      try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(v));
      } catch {
        /* ignore */
      }
    },
    () => memory.delete(key),
  );
  return p;
}

async function fetchWeather(lat: number, lng: number, month: number): Promise<TypicalWeather> {
  const now = new Date();
  // Use complete past occurrences of this month only.
  const lastYear = month < now.getMonth() + 1 ? now.getFullYear() : now.getFullYear() - 1;
  const years = Array.from({ length: YEARS_BACK }, (_, i) => lastYear - (YEARS_BACK - 1) + i);
  const mm = String(month).padStart(2, '0');
  const lastDay = new Date(lastYear, month, 0).getDate();

  const url = new URL('https://archive-api.open-meteo.com/v1/archive');
  url.search = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    start_date: `${years[0]}-${mm}-01`,
    end_date: `${lastYear}-${mm}-${lastDay}`,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'auto',
  }).toString();

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  const data = (await res.json()) as {
    daily: { time: string[]; temperature_2m_max: (number | null)[]; temperature_2m_min: (number | null)[]; precipitation_sum: (number | null)[] };
  };

  const highs: number[] = [];
  const lows: number[] = [];
  let rainy = 0;
  let precip = 0;
  data.daily.time.forEach((t, i) => {
    if (Number(t.slice(5, 7)) !== month) return; // the range spans other months
    const hi = data.daily.temperature_2m_max[i];
    const lo = data.daily.temperature_2m_min[i];
    const pr = data.daily.precipitation_sum[i];
    if (hi != null) highs.push(hi);
    if (lo != null) lows.push(lo);
    if (pr != null) {
      precip += pr;
      if (pr >= 1) rainy += 1;
    }
  });
  if (!highs.length) throw new Error('No weather data');
  const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;

  return {
    month,
    years,
    avgHigh: round1(avg(highs)),
    avgLow: round1(avg(lows)),
    rainyDays: Math.round(rainy / years.length),
    precipitation: Math.round(precip / years.length),
  };
}
