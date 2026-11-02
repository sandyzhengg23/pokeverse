/**
 * Fixed-window rate limiting for the AI routes.
 *
 * Shared store (works across serverless instances): Upstash Redis via its REST
 * API, used automatically when UPSTASH_REDIS_REST_URL/TOKEN (or the Vercel
 * KV_REST_API_URL/TOKEN equivalents) are set. No SDK needed, just `fetch`.
 *
 * Without those variables, or if Redis is unreachable, it falls back to an
 * in-memory counter. That still limits abuse per server instance but is NOT
 * shared across instances, so configure Upstash before a public deployment.
 */

interface Limit {
  /** Bucket name, e.g. "scan". */
  name: string;
  max: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const memory = new Map<string, { count: number; resetAt: number }>();
let warned = false;

function memoryHit(key: string, { max, windowSeconds }: Limit): RateLimitResult {
  const now = Date.now();
  // Opportunistic cleanup so the map can't grow without bound.
  if (memory.size > 5000) for (const [k, v] of memory) if (v.resetAt < now) memory.delete(k);
  let entry = memory.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowSeconds * 1000 };
    memory.set(key, entry);
  }
  entry.count += 1;
  return { ok: entry.count <= max, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
}

async function redisHit(key: string, { max, windowSeconds }: Limit): Promise<RateLimitResult | null> {
  const url = redisUrl();
  const token = redisToken();
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSeconds, "NX"],
        ["TTL", key],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const out = (await res.json()) as { result?: unknown }[];
    const count = Number(out[0]?.result);
    const ttl = Number(out[2]?.result);
    if (!Number.isFinite(count)) return null;
    return { ok: count <= max, retryAfterSeconds: ttl > 0 ? ttl : windowSeconds };
  } catch {
    return null; // fall back to memory rather than letting traffic through unmetered
  }
}

async function hit(key: string, limit: Limit): Promise<RateLimitResult> {
  const shared = await redisHit(key, limit);
  if (shared) return shared;
  if (!warned && process.env.NODE_ENV === "production") {
    warned = true;
    console.warn("[rate-limit] Shared store not configured or unreachable; using per-instance memory.");
  }
  return memoryHit(key, limit);
}

/** Best-effort client IP. On Vercel, x-forwarded-for is set by the platform. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

const DAILY_CALL_CAP = Number(process.env.AI_DAILY_CALL_LIMIT) > 0 ? Number(process.env.AI_DAILY_CALL_LIMIT) : 500;

/**
 * Applies a per-IP limit AND a global daily cap on AI calls (a spending guard
 * against distributed abuse). Returns the first limit that is exceeded.
 */
export async function limitAiRequest(request: Request, perIp: Limit): Promise<RateLimitResult> {
  const ip = await hit(`rl:${perIp.name}:${clientIp(request)}`, perIp);
  if (!ip.ok) return ip;
  const day = new Date().toISOString().slice(0, 10);
  return hit(`rl:global:${day}`, { name: "global", max: DAILY_CALL_CAP, windowSeconds: 86_400 });
}

export function tooManyRequests(result: RateLimitResult, message = "Too many requests. Please try again later.") {
  return Response.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
  );
}
