/**
 * Vercel server function: the trip planner's chat proxy.
 *
 * Holds the site owner's Groq key server-side (env GROQ_API_KEY, never sent to the
 * browser) so visitors can use the planner without their own key. Because the endpoint
 * is public, it only accepts trip-planner requests from this site, with size, length and
 * rate limits. Visitors who paste their own key talk to Groq directly and skip this.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';
const PROMPT_PREFIX = 'You are the trip planner inside "Running Atlas"';

const LIMITS = {
  bodyBytes: 120_000,
  turns: 30, // user + assistant messages after the system prompt
  systemChars: 24_000,
  userChars: 2_000,
  assistantChars: 12_000,
};

// Best-effort rate limit, per server instance (Vercel reuses warm instances).
const WINDOW_MS = 10 * 60 * 1000;
const PER_IP = 20; // requests per IP per window
const PER_INSTANCE = 200; // all visitors, per window
const hits = new Map(); // ip -> timestamps
let instanceHits = [];

function rateLimited(ip) {
  const now = Date.now();
  instanceHits = instanceHits.filter((t) => now - t < WINDOW_MS);
  const mine = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (mine.length >= PER_IP || instanceHits.length >= PER_INSTANCE) {
    hits.set(ip, mine);
    return true;
  }
  mine.push(now);
  instanceHits.push(now);
  hits.set(ip, mine);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return false;
}

function json(status, message, extra = {}) {
  return new Response(JSON.stringify({ error: { message }, ...extra }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/** Only browsers on this site (or origins listed in ALLOWED_ORIGINS) may call the proxy. */
function originAllowed(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  let host;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  const self = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (host === self) return true;
  const extra = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return extra.includes(origin);
}

function validMessages(messages) {
  if (!Array.isArray(messages) || messages.length < 2) return false;
  const [system, ...rest] = messages;
  if (system?.role !== 'system' || typeof system.content !== 'string') return false;
  if (!system.content.startsWith(PROMPT_PREFIX) || system.content.length > LIMITS.systemChars) return false;
  if (rest.length > LIMITS.turns) return false;
  for (const m of rest) {
    if (typeof m?.content !== 'string') return false;
    if (m.role === 'user' && m.content.length > LIMITS.userChars) return false;
    if (m.role === 'assistant' && m.content.length > LIMITS.assistantChars) return false;
    if (m.role !== 'user' && m.role !== 'assistant') return false;
  }
  return rest[rest.length - 1].role === 'user';
}

/** GET tells the page whether the shared key is configured. */
export function GET() {
  return new Response(JSON.stringify({ available: !!process.env.GROQ_API_KEY }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function POST(request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return json(503, 'The shared trip planner is not configured.');
  if (!originAllowed(request)) return json(403, 'Requests are only accepted from this site.');

  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
  if (rateLimited(ip)) return json(429, 'The trip planner is busy. Please wait a few minutes and try again.');

  const raw = await request.text();
  if (raw.length > LIMITS.bodyBytes) return json(413, 'This conversation is too long. Start over to continue.');
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, 'Invalid request.');
  }
  if (!validMessages(body?.messages)) return json(400, 'Invalid or too long conversation. Start over to continue.');

  // Model and generation settings are fixed here; the client can't change them.
  const upstream = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: body.messages.map(({ role, content }) => ({ role, content })),
      stream: true,
      temperature: 0.5,
      max_tokens: 4096,
      reasoning_effort: 'low',
    }),
    signal: request.signal,
  });

  if (!upstream.ok || !upstream.body) {
    if (upstream.status === 429) return json(429, 'The trip planner has reached its free usage limit. Try again in a minute.');
    console.error('Groq error', upstream.status, (await upstream.text()).slice(0, 300));
    return json(502, 'The trip planner is unavailable right now. Please try again later.');
  }

  return new Response(upstream.body, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
