/**
 * Admin sessions — HMAC-SHA256 signed tokens via Web Crypto, so the SAME
 * code verifies in the edge proxy and signs in node route handlers.
 * Token: base64url(payload).base64url(hmac). No session state on disk.
 */

const enc = new TextEncoder();

export const SESSION_COOKIE = "tw_admin";
export const SESSION_HOURS = 8;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set (≥16 chars) in production");
  }
  return "tripwaley-dev-secret-change-me";
}

const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const b64urlDecode = (s: string) => {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  return atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
};

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createSession(): Promise<string> {
  const payload = JSON.stringify({ v: 1, exp: Date.now() + SESSION_HOURS * 3600_000 });
  const body = b64url(enc.encode(payload));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  try {
    const sigBytes = Uint8Array.from(b64urlDecode(sig), (c) => c.charCodeAt(0));
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(), sigBytes, enc.encode(body));
    if (!ok) return false;
    const payload = JSON.parse(b64urlDecode(body)) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}
