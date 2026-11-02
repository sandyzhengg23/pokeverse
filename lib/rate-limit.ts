/**
 * Rate limiting and the global daily AI budget for /api/scan and /api/journey.
 *
 * Two independent safeguards:
 *  1. limitPerIp()   – a per-visitor fixed window (abuse protection). Runs first, before any body parsing.
 *  2. reserveAiCall() – ONE shared counter for the whole app. Every Meta request, from either
 *                       feature and any visitor/instance, consumes one unit. Call it immediately
 *                       before contacting Meta, after the request has been validated, so rejected
 *                       or malformed requests don't burn the budget.
 *
 * Storage is Upstash Redis over its REST API (plain `fetch`, no SDK). Each counter update is a single
 * MULTI/EXEC transaction (SET NX EX + INCR + TTL), so concurrent requests on any number of serverless
 * instances each get a distinct count and the TTL can never be lost.
 *
 * FAIL CLOSED: in production, if Redis is not configured or can't be reached, both checks reject the
 * request (503) instead of allowing unmetered AI usage. Outside production an in-memory counter is used
 * so local development works without Redis.
 */

export type Decision =
  | { ok: true }
  | { ok: false; reason: "limited"; retryAfterSeconds: number }
  | { ok: false; reason: "unavailable" };

interface Limit {
  /** Bucket name, e.g. "scan". */
  name: string;
  max: number;
  windowSeconds: number;
}

const PREFIX = "pokeverse";
const DEFAULT_DAILY_AI_CALLS = 500;

const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const isProduction = () => process.env.NODE_ENV === "production";

/* ------------------------------ time helpers ------------------------------ */

export function dailyKey(now: Date): string {
  return `${PREFIX}:ai-daily:${now.toISOString().slice(0, 10)}`; // UTC date → resets at 00:00 UTC
}

export function secondsUntilMidnightUtc(now: Date): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}

/**
 * AI_DAILY_CALL_LIMIT: unset → 500. A whole number ≥ 0 → that many Meta calls per UTC day
 * (0 blocks all AI features). Anything else is a misconfiguration and blocks AI rather than guessing.
 */
export function parseDailyCap(raw: string | undefined = process.env.AI_DAILY_CALL_LIMIT): number {
  if (raw === undefined || raw.trim() === "") return DEFAULT_DAILY_AI_CALLS;
  return /^\d{1,7}$/.test(raw.trim()) ? Number(raw.trim()) : 0;
}

/* -------------------------------- counters -------------------------------- */

interface CounterResult {
  count: number;
  ttlSeconds: number;
}

const memory = new Map<string, { count: number; resetAt: number }>();

function memoryCounter(key: string, ttlSeconds: number): CounterResult {
  const now = Date.now();
  if (memory.size > 5000) for (const [k, v] of memory) if (v.resetAt < now) memory.delete(k);
  let entry = memory.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + ttlSeconds * 1000 };
    memory.set(key, entry);
  }
  entry.count += 1;
  return { count: entry.count, ttlSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
}

/** Atomically creates the key with a TTL if needed, increments it, and reads the TTL. null = Redis problem. */
async function redisCounter(key: string, ttlSeconds: number): Promise<CounterResult | null> {
  const url = redisUrl();
  const token = redisToken();
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/multi-exec`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["SET", key, "0", "EX", String(ttlSeconds), "NX"],
        ["INCR", key],
        ["TTL", key],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const out = (await res.json()) as { result?: unknown; error?: unknown }[];
    if (!Array.isArray(out) || out.length !== 3 || out.some((r) => r?.error !== undefined)) return null;
    const count = Number(out[1].result);
    const ttl = Number(out[2].result);
    if (!Number.isSafeInteger(count) || count < 1) return null;
    return { count, ttlSeconds: Number.isFinite(ttl) && ttl > 0 ? ttl : ttlSeconds };
  } catch {
    return null;
  }
}

let lastUnavailableLog = 0;

/** Redis first. Only outside production may we use memory. Returns null when no trustworthy count exists. */
async function counter(key: string, ttlSeconds: number): Promise<CounterResult | null> {
  const shared = await redisCounter(key, ttlSeconds);
  if (shared) return shared;
  if (isProduction()) {
    // Throttled and secret-free: says what is wrong, never the URL, token or request.
    if (Date.now() - lastUnavailableLog > 60_000) {
      lastUnavailableLog = Date.now();
      console.error("[rate-limit] Redis store unavailable or not configured; rejecting AI requests (fail closed).");
    }
    return null;
  }
  return memoryCounter(key, ttlSeconds);
}

/* --------------------------------- public API ------------------------------ */

/** Best-effort client IP. On Vercel the platform sets x-forwarded-for; elsewhere it can be spoofed. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

async function hashIp(ip: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Per-visitor fixed window. Raw IPs are never stored; only a truncated hash. */
export async function limitPerIp(request: Request, limit: Limit): Promise<Decision> {
  const key = `${PREFIX}:ip:${limit.name}:${await hashIp(clientIp(request))}`;
  const result = await counter(key, limit.windowSeconds);
  if (!result) return { ok: false, reason: "unavailable" };
  return result.count <= limit.max ? { ok: true } : { ok: false, reason: "limited", retryAfterSeconds: result.ttlSeconds };
}

/**
 * Consumes one unit of the app-wide daily Meta budget. Call right before a Meta request.
 * Does not refund on failure: a failed or timed-out request may still have been billed.
 */
export async function reserveAiCall(now: Date = new Date()): Promise<Decision> {
  const cap = parseDailyCap();
  const retryAfterSeconds = secondsUntilMidnightUtc(now);
  if (cap === 0) return { ok: false, reason: "limited", retryAfterSeconds };
  // Key lives past midnight only for cleanup; the date in the key name is what resets the count.
  const result = await counter(dailyKey(now), retryAfterSeconds + 86_400);
  if (!result) return { ok: false, reason: "unavailable" };
  return result.count <= cap ? { ok: true } : { ok: false, reason: "limited", retryAfterSeconds };
}

/** Turns a rejected decision into the HTTP response. */
export function blockedResponse(
  decision: Exclude<Decision, { ok: true }>,
  messages: { perIp?: string; daily?: string } = {},
) {
  if (decision.reason === "unavailable") {
    return Response.json({ error: "This feature is temporarily unavailable. Please try again later." }, { status: 503 });
  }
  return Response.json(
    { error: messages.perIp ?? messages.daily ?? "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
  );
}

export const DAILY_LIMIT_MESSAGE =
  "PokéVerse’s AI features have reached today’s limit. Please try again after midnight UTC.";
