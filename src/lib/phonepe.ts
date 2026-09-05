import { createHash, timingSafeEqual } from "node:crypto";
import { resolveGateway } from "./gatewayConfig";

/**
 * PhonePe Payment Gateway — Standard Checkout V2 (OAuth).
 *
 * This is the OAuth API, identified by credentials shaped as
 * client_id / client_secret / client_version. It is NOT the older
 * merchantId + saltKey / X-VERIFY checksum flow that most tutorials still
 * show — different endpoints, different auth, nothing transfers.
 *
 * Credentials come from lib/gatewayConfig.ts: the environment first, then
 * whatever was saved in the admin panel. If neither supplies them the module
 * reports itself unconfigured and callers must not render a Pay button —
 * a missing key means "no payment offered", never "a button that 500s".
 *
 *   PHONEPE_CLIENT_ID
 *   PHONEPE_CLIENT_SECRET
 *   PHONEPE_CLIENT_VERSION
 *   PHONEPE_ENV            sandbox | production   (default: sandbox)
 *   PHONEPE_WEBHOOK_USER   the username set on the dashboard's Webhooks tab
 *   PHONEPE_WEBHOOK_PASS   the password set alongside it
 */

type Env = "sandbox" | "production";

const ENDPOINTS: Record<Env, { oauth: string; pay: string; status: (id: string) => string }> = {
  sandbox: {
    oauth: "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
    pay: "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay",
    status: (id) => `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order/${encodeURIComponent(id)}/status?details=false`,
  },
  production: {
    // note the different host path for auth in production — identity-manager,
    // not pg. Getting this wrong is the classic go-live failure.
    oauth: "https://api.phonepe.com/apis/identity-manager/v1/oauth/token",
    pay: "https://api.phonepe.com/apis/pg/checkout/v2/pay",
    status: (id) => `https://api.phonepe.com/apis/pg/checkout/v2/order/${encodeURIComponent(id)}/status?details=false`,
  },
};

export function phonepeEnv(): Env {
  return resolveGateway().env;
}

function creds() {
  const g = resolveGateway();
  return { clientId: g.clientId, clientSecret: g.clientSecret, clientVersion: g.clientVersion };
}

/** True only when a payment could actually be created. */
export function phonepeConfigured(): boolean {
  const c = creds();
  return Boolean(c.clientId && c.clientSecret && c.clientVersion);
}

export class PhonePeError extends Error {
  constructor(message: string, readonly code?: string, readonly status?: number) {
    super(message);
    this.name = "PhonePeError";
  }
}

/* ---------------------------------------------------------------- token */

/* The access token is valid for hours. Fetching a fresh one per payment adds a
   round-trip to the slowest, most abandonment-prone moment in the funnel, so
   it is cached in module memory and reused until just before it expires. */
let cached: { token: string; expiresAtMs: number; fingerprint: string } | null = null;

/** identifies the credential set a token was minted with, without storing it */
function fingerprint(clientId: string, clientSecret: string, clientVersion: string, env: string): string {
  return createHash("sha256").update(`${clientId}:${clientSecret}:${clientVersion}:${env}`).digest("hex");
}

async function getToken(): Promise<string> {
  const { clientId, clientSecret, clientVersion } = creds();
  if (!clientId || !clientSecret || !clientVersion) {
    throw new PhonePeError("PhonePe credentials are not configured");
  }

  // credentials edited in the admin panel must not keep using a token minted
  // with the old ones — otherwise a key change appears to do nothing until the
  // token happens to expire, hours later
  const fp = fingerprint(clientId, clientSecret, clientVersion, phonepeEnv());
  if (cached && cached.fingerprint === fp && Date.now() < cached.expiresAtMs) return cached.token;

  const body = new URLSearchParams({
    client_id: clientId,
    client_version: clientVersion,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const res = await fetch(ENDPOINTS[phonepeEnv()].oauth, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.access_token) {
    // deliberately does not echo the response body — it can carry the secret back
    throw new PhonePeError(`PhonePe auth failed (HTTP ${res.status})`, json?.code, res.status);
  }

  // expires_at is epoch SECONDS; tolerate a millisecond value just in case
  const rawExp = Number(json.expires_at) || 0;
  const expMs = rawExp > 1e12 ? rawExp : rawExp * 1000;
  const fallback = Date.now() + 15 * 60 * 1000;
  cached = {
    token: json.access_token as string,
    // refresh a minute early so a request never races the expiry
    expiresAtMs: (expMs > Date.now() ? expMs : fallback) - 60_000,
    fingerprint: fp,
  };
  return cached.token;
}

/** Drop the cached token — used when a call is rejected as unauthorised. */
function invalidateToken() {
  cached = null;
}

async function authed(url: string, init: RequestInit, retryOn401 = true): Promise<Response> {
  const token = await getToken();
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `O-Bearer ${token}`, ...(init.headers ?? {}) },
    cache: "no-store",
  });
  if (res.status === 401 && retryOn401) {
    // the cached token was revoked or rotated on PhonePe's side — one retry
    invalidateToken();
    return authed(url, init, false);
  }
  return res;
}

/* -------------------------------------------------------------- payment */

export interface CreatePaymentInput {
  merchantOrderId: string;
  /** integer paise; PhonePe rejects anything under 100 */
  amountPaise: number;
  redirectUrl: string;
  message?: string;
  /** udf1–udf10 ≤256 chars; udf11–udf15 alphanumeric + _-+@. ≤50 chars */
  metaInfo?: Record<string, string>;
  /** seconds until the checkout session dies; PhonePe allows 300–3600 */
  expireAfter?: number;
}

export interface CreatePaymentResult {
  orderId: string;
  state: string;
  redirectUrl: string;
  expireAt?: number;
}

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  if (!/^[A-Za-z0-9_-]{1,63}$/.test(input.merchantOrderId)) {
    throw new PhonePeError("merchantOrderId must be ≤63 chars of letters, digits, _ or -");
  }
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) {
    throw new PhonePeError("amount must be a whole number of paise, at least 100");
  }

  const res = await authed(ENDPOINTS[phonepeEnv()].pay, {
    method: "POST",
    body: JSON.stringify({
      merchantOrderId: input.merchantOrderId,
      amount: input.amountPaise,
      expireAfter: Math.min(3600, Math.max(300, input.expireAfter ?? 1200)),
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: input.message ?? "Tripwaley seat hold",
        merchantUrls: { redirectUrl: input.redirectUrl },
      },
      ...(input.metaInfo ? { metaInfo: input.metaInfo } : {}),
    }),
    signal: AbortSignal.timeout(12000),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.redirectUrl) {
    throw new PhonePeError(
      json?.message || `PhonePe could not create the payment (HTTP ${res.status})`,
      json?.code,
      res.status
    );
  }

  return {
    orderId: String(json.orderId ?? ""),
    state: String(json.state ?? "PENDING"),
    redirectUrl: String(json.redirectUrl),
    expireAt: typeof json.expireAt === "number" ? json.expireAt : undefined,
  };
}

/* --------------------------------------------------------------- status */

export interface OrderStatusResult {
  /** PENDING | FAILED | COMPLETED */
  state: string;
  /** integer paise, as PhonePe holds it */
  amount: number;
  orderId?: string;
  transactionId?: string;
  paymentMode?: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * The single source of truth on whether money moved.
 *
 * The browser's return from PhonePe proves nothing — anyone can navigate to a
 * return URL. Every confirmation in this app goes through this call.
 */
export async function orderStatus(merchantOrderId: string): Promise<OrderStatusResult> {
  const res = await authed(ENDPOINTS[phonepeEnv()].status(merchantOrderId), {
    method: "GET",
    signal: AbortSignal.timeout(10000),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.state) {
    throw new PhonePeError(
      json?.message || `PhonePe status check failed (HTTP ${res.status})`,
      json?.code,
      res.status
    );
  }

  const latest = Array.isArray(json.paymentDetails) ? json.paymentDetails[0] : undefined;
  return {
    state: String(json.state),
    amount: Number(json.amount) || 0,
    orderId: json.orderId ? String(json.orderId) : undefined,
    transactionId: latest?.transactionId ? String(latest.transactionId) : undefined,
    paymentMode: latest?.paymentMode ? String(latest.paymentMode) : undefined,
    errorCode: json.errorCode ? String(json.errorCode) : latest?.errorCode ? String(latest.errorCode) : undefined,
    errorMessage: json.errorContext?.description ? String(json.errorContext.description) : undefined,
  };
}

/* -------------------------------------------------------------- webhook */

/**
 * PhonePe authenticates its callback by sending SHA256(username:password),
 * hex, as the Authorization header value — the credentials you set yourself on
 * the dashboard's Webhooks tab. Recompute and compare; on a mismatch the
 * webhook is discarded and the Order Status API remains the authority.
 *
 * Returns false when the webhook credentials are unset, so an unconfigured
 * deployment rejects callbacks rather than accepting every one of them.
 */
export function verifyWebhookAuth(header: string | null): boolean {
  const { webhookUser: user, webhookPass: pass } = resolveGateway();
  if (!user || !pass || !header) return false;

  const expected = createHash("sha256").update(`${user}:${pass}`).digest("hex");
  // PhonePe sends the bare digest; tolerate a "SHA256 " prefix defensively
  const got = header.trim().replace(/^SHA256\s+/i, "").toLowerCase();
  if (got.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}
