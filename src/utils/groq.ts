/**
 * Minimal Groq client (OpenAI-compatible API).
 * A visitor's own key (localStorage) calls Groq directly from the browser. Without one,
 * requests go to the site's /api/chat proxy, which holds the owner's key server-side.
 */
const BASE = 'https://api.groq.com/openai/v1';
const KEY_STORAGE = 'ra:groq:key';

/** The planner always uses this Groq model. */
export const MODEL = 'openai/gpt-oss-120b';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function read(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}
function write(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* storage unavailable — keep in memory only */
  }
}

/**
 * Key from .env (VITE_GROQ_API_KEY), for `npm run dev` only. Production builds never
 * include it (import.meta.env.DEV is false there, so the branch is stripped), which keeps
 * the key out of any deployed bundle. Visitors paste their own key instead.
 */
export const ENV_API_KEY: string = import.meta.env.DEV ? (import.meta.env.VITE_GROQ_API_KEY ?? '').trim() : '';

/** A key saved in this browser takes priority; otherwise fall back to the .env key. */
export const getApiKey = () => read(KEY_STORAGE) || ENV_API_KEY;
export const setApiKey = (k: string) => write(KEY_STORAGE, k.trim());

export class GroqError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

async function errorFrom(res: Response): Promise<GroqError> {
  let detail = '';
  try {
    const body = await res.json();
    detail = body?.error?.message ?? '';
  } catch {
    /* ignore */
  }
  if (res.status === 401) return new GroqError('That Groq API key was rejected. Check it in settings.', 401);
  if (res.status === 429) return new GroqError('Groq free-tier rate limit reached. Wait a minute and try again.', 429);
  return new GroqError(detail || `Groq request failed (${res.status}).`, res.status);
}

/** The proxy already returns visitor-friendly messages. */
async function proxyErrorFrom(res: Response): Promise<GroqError> {
  try {
    const body = await res.json();
    if (body?.error?.message) return new GroqError(body.error.message, res.status);
  } catch {
    /* ignore */
  }
  return new GroqError('The trip planner is unavailable right now. Please try again later.', res.status);
}

/** Lists models for this key; used to validate a pasted key. */
export async function listModels(apiKey: string): Promise<string[]> {
  const res = await fetch(`${BASE}/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) throw await errorFrom(res);
  const body = (await res.json()) as { data: { id: string; active?: boolean }[] };
  return body.data
    .filter((m) => m.active !== false && !/whisper|tts|guard|safeguard|orpheus|playai|allam/i.test(m.id))
    .map((m) => m.id)
    .sort();
}


/** Same-site server function holding the owner's key (see api/chat.js). */
const PROXY_URL = '/api/chat';
let proxyCheck: Promise<boolean> | null = null;

/** Whether the deployed site offers the shared planner (no visitor key needed). */
export function sharedPlannerAvailable(): Promise<boolean> {
  proxyCheck ??= fetch(PROXY_URL, { headers: { Accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : null))
    .then((b) => b?.available === true)
    .catch(() => false);
  return proxyCheck;
}

/**
 * Stream a chat completion; calls onDelta with each text chunk. Resolves with the full text.
 * With an apiKey it calls Groq directly; without one it goes through the shared proxy.
 */
export async function streamChat(
  opts: { apiKey: string; model: string; messages: ChatMessage[]; signal?: AbortSignal },
  onDelta: (text: string) => void,
): Promise<string> {
  const viaProxy = !opts.apiKey;
  const res = await fetch(viaProxy ? PROXY_URL : `${BASE}/chat/completions`, {
    method: 'POST',
    headers: viaProxy ? { 'Content-Type': 'application/json' } : { Authorization: `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
    body: viaProxy ? JSON.stringify({ messages: opts.messages }) : JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      stream: true,
      temperature: 0.5,
      // Room for a full plan; reasoning models also spend tokens thinking.
      max_tokens: 4096,
      // gpt-oss models: keep hidden reasoning short so answers start quickly.
      ...(opts.model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
    }),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) throw viaProxy ? await proxyErrorFrom(res) : await errorFrom(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') return full;
      try {
        const json = JSON.parse(data);
        const delta: string = json.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          full += delta;
          onDelta(delta);
        }
      } catch {
        /* partial / keep-alive line */
      }
    }
  }
  return full;
}
