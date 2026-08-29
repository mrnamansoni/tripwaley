/**
 * Admin authentication — NODE runtime only (scrypt).
 *
 * Production config (env):
 *   ADMIN_PASSWORD_HASH  scrypt hash from `node scripts/hash-password.mjs "your-pass"`
 *   SESSION_SECRET       ≥16 random chars
 * Dev fallback: ADMIN_PASSWORD (plain) or "tripwaley@2026" with a console warning.
 */

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (stored && stored.includes(":")) {
    const [salt, hash] = stored.split(":");
    const expected = Buffer.from(hash, "hex");
    const got = scryptSync(pw, salt, expected.length);
    return expected.length === got.length && timingSafeEqual(expected, got);
  }
  if (process.env.NODE_ENV === "production") return false; // hash is mandatory in prod
  const plain = process.env.ADMIN_PASSWORD ?? "tripwaley@2026";
  if (!process.env.ADMIN_PASSWORD) {
    console.warn("[admin] using default dev password — set ADMIN_PASSWORD_HASH before deploying");
  }
  const a = Buffer.from(pw);
  const b = Buffer.from(plain);
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ---------------------------------------------- login rate limiting */

const attempts = new Map<string, { count: number; until: number }>();
const MAX_TRIES = 5;
const WINDOW_MS = 15 * 60_000;

export function rateLimit(ip: string): { blocked: boolean; retryMin?: number } {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && rec.count >= MAX_TRIES && rec.until > now) {
    return { blocked: true, retryMin: Math.ceil((rec.until - now) / 60_000) };
  }
  if (rec && rec.until <= now) attempts.delete(ip);
  return { blocked: false };
}

export function recordFailure(ip: string) {
  const rec = attempts.get(ip) ?? { count: 0, until: 0 };
  rec.count += 1;
  rec.until = Date.now() + WINDOW_MS;
  attempts.set(ip, rec);
}

export function clearFailures(ip: string) {
  attempts.delete(ip);
}

/** mutating admin requests must come from our own origin */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetches may omit it
  const host = req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const clientIp = (req: Request) =>
  (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();

/* ---------------------------------------------- public endpoint throttling

   Deliberately NOT rateLimit() above: that one counts *failed* logins, so a
   successful request never increments it. A lead or coupon endpoint has to
   count every request, successful or not — otherwise a script that submits
   valid rows is unlimited, which is exactly the abuse case.

   In-memory, so it resets on deploy and is per-instance. That is fine for a
   single VPS; a CDN in front would enforce this at the edge instead. */

const hits = new Map<string, { n: number; resetAt: number }>();

export function publicRateLimit(
  ip: string,
  bucket: string,
  max = 12,
  windowMs = 60_000
): { blocked: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = `${bucket}:${ip}`;
  const rec = hits.get(key);

  if (!rec || rec.resetAt <= now) {
    hits.set(key, { n: 1, resetAt: now + windowMs });
    // opportunistic sweep so the map cannot grow without bound
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    return { blocked: false };
  }

  rec.n += 1;
  if (rec.n > max) {
    return { blocked: true, retryAfter: Math.ceil((rec.resetAt - now) / 1000) };
  }
  return { blocked: false };
}
