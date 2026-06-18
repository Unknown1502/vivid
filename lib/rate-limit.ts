/**
 * Lightweight in-memory sliding-window rate limiter for /api/generate.
 *
 * Vivid posts a public, unauthenticated endpoint that spends money per call to
 * 1,000+ people during judging. This stops casual abuse / runaway bills. It's
 * per-instance (fine for a hackathon); swap for Upstash Redis if you need it to
 * hold across serverless instances at scale.
 */

type Bucket = number[]; // request timestamps (ms)
const store = new Map<string, Bucket>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_PER_WINDOW = 20; // generations per IP per minute

let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [key, hits] of store) {
    const fresh = hits.filter((t) => now - t < WINDOW_MS);
    if (fresh.length) store.set(key, fresh);
    else store.delete(key);
  }
}

export function checkRateLimit(key: string): {
  ok: boolean;
  retryAfter: number;
} {
  const now = Date.now();
  sweep(now);
  const hits = (store.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - hits[0])) / 1000);
    store.set(key, hits);
    return { ok: false, retryAfter: Math.max(1, retryAfter) };
  }
  hits.push(now);
  store.set(key, hits);
  return { ok: true, retryAfter: 0 };
}

/** Best-effort client key from proxy headers (Vercel sets x-forwarded-for). */
export function clientKey(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "anonymous"
  );
}
