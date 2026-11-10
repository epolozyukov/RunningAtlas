import type { Marathon } from '../types';

/**
 * Reference price levels for trip budgets, in EUR, mid-range comfort.
 * Rough but realistic anchors so the AI doesn't invent prices: it applies
 * these with fixed rules and shows its working in the budget table.
 * Edit freely if your experience differs.
 */
type Tier = 'low' | 'mid' | 'high' | 'very-high';

type Range = [number, number];

interface TierPrices {
  /** Mid-range hotel, double/twin room per night, normal dates. */
  room: Range;
  /** Larger room or apartment for 3–4 people, per night. */
  familyRoom: Range;
  /** Food & drink per person per day (cafés + restaurants, no fine dining). */
  food: Range;
  /** Public transport / occasional taxi per person per day. */
  local: Range;
  /** Typical marathon entry fee for a non-major. */
  entry: Range;
}

const TIERS: Record<Tier, TierPrices> = {
  low: { room: [50, 90], familyRoom: [70, 120], food: [20, 35], local: [4, 10], entry: [30, 70] },
  mid: { room: [80, 140], familyRoom: [110, 180], food: [30, 50], local: [6, 12], entry: [50, 100] },
  high: { room: [130, 220], familyRoom: [180, 300], food: [45, 75], local: [8, 15], entry: [80, 150] },
  'very-high': { room: [180, 320], familyRoom: [250, 420], food: [60, 100], local: [10, 20], entry: [100, 180] },
};

const COUNTRY_TIER: Record<string, Tier> = {
  Ukraine: 'low', India: 'low', Vietnam: 'low', Kenya: 'low', Tanzania: 'low', Nigeria: 'low', Morocco: 'low',
  Serbia: 'low', Bulgaria: 'low', Romania: 'low', Türkiye: 'low', Kazakhstan: 'low', Mexico: 'low', Brazil: 'low',
  Argentina: 'low', 'South Africa': 'low', Malaysia: 'low',
  Poland: 'mid', Czechia: 'mid', Hungary: 'mid', Slovakia: 'mid', Slovenia: 'mid', Croatia: 'mid', Lithuania: 'mid',
  Latvia: 'mid', Estonia: 'mid', Portugal: 'mid', Greece: 'mid', Spain: 'mid', Malta: 'mid', China: 'mid',
  Taiwan: 'mid', Chile: 'mid', 'South Korea': 'mid',
  Germany: 'high', Austria: 'high', Italy: 'high', France: 'high', Belgium: 'high', Netherlands: 'high',
  Ireland: 'high', 'United Kingdom': 'high', Finland: 'high', Japan: 'high', Australia: 'high', 'New Zealand': 'high',
  Canada: 'high', Israel: 'high', 'United Arab Emirates': 'high', Singapore: 'high', Luxembourg: 'high',
  Switzerland: 'very-high', Norway: 'very-high', Iceland: 'very-high', Denmark: 'very-high', Sweden: 'very-high',
  'United States': 'very-high',
};

const fmt = ([a, b]: Range) => `€${Math.round(a)}–${Math.round(b)}`;
const scale = ([a, b]: Range, k: number): Range => [a * k, b * k];

/** Price guide text for the system prompt. */
export function priceGuide(m: Marathon): string {
  const tier = COUNTRY_TIER[m.country] ?? 'mid';
  const p = TIERS[tier];
  // Hotels fill up on race weekend; the biggest races push prices hardest.
  const surge = m.major ? 1.5 : 1.25;
  const entry: Range = m.major ? [150, 300] : p.entry;

  return [
    `PRICE GUIDE for ${m.city} (EUR, mid-range, ${tier} price level). Use these figures. Do not invent lower ones.`,
    `- Hotel double/twin room per night on race weekend: ${fmt(scale(p.room, surge))} (normal dates ${fmt(p.room)}).`,
    `- Family room or apartment for 3–4 people per night on race weekend: ${fmt(scale(p.familyRoom, surge))}.`,
    `- Food per person per day: ${fmt(p.food)} (children under 12: about half).`,
    `- Local transport per person per day: ${fmt(p.local)}, plus airport/station transfers.`,
    `- Marathon entry per runner: ${fmt(entry)}${m.major ? ' (Major: plus lottery, charity or tour-operator options that can cost far more)' : ''}.`,
    '- Return travel per person, booked 2–3 months ahead, including a cabin bag: short-haul flight in Europe under 2,000 km €100–250; 2,000–5,000 km €200–500; long-haul €500–1,200. Trains and buses: use realistic fares for the route. For driving: fuel and tolls per car, not per person.',
    '',
    'BUDGET RULES',
    '- Do NOT write the budget as a Markdown table and do NOT calculate totals. The app calculates them.',
    '- Instead output exactly one fenced code block with the language "budget" containing JSON. Format example only: replace every number with values for THIS trip and THIS city\'s price guide:',
    '```budget',
    '{"travellers": 3, "items": [',
    '  {"item": "Race entry", "qty": 1, "unit": "runner", "low": 50, "high": 100},',
    '  {"item": "Return flights", "qty": 3, "unit": "person", "low": 100, "high": 250},',
    '  {"item": "Accommodation", "qty": 3, "unit": "night, family room", "low": 140, "high": 225},',
    '  {"item": "Food", "qty": 4, "unit": "day for 3 people", "low": 75, "high": 125},',
    '  {"item": "Local transport", "qty": 12, "unit": "person-day", "low": 6, "high": 12}',
    ']}',
    '```',
    '- "low"/"high" are the UNIT price range in EUR (whole numbers); "qty" is how many units. Use the price guide for unit prices.',
    '- Nights = days − 1. Rooms: couples and families share; adults otherwise two per room. Accommodation is priced per room.',
    '- Food and local transport scale with people and days (children under 12 about half for food). Race entry only for runners.',
    '- Include every cost: entry, travel there and back (and transfers), accommodation, food, local transport. Do not add an extras row: the app adds a 10% buffer.',
    '- After the block, add at most two short lines on how to save money.',
  ].join('\n');
}
