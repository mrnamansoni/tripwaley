import { getCreator, getSettings } from "./catalog";
import { pickWebhookUrl } from "./webhookPayload";

/**
 * Delivering events to n8n — SERVER ONLY.
 *
 * Every sender on the site goes through here. Before this existed there were
 * three: /api/lead read only N8N_WEBHOOK_URL, /api/college-quote read the env
 * OR the admin setting, and /api/book and settle.ts read only
 * TW_BOOKING_WEBHOOK. So a URL pasted into Admin → Settings — the field is
 * literally labelled "n8n / CRM webhook url" — made college quotes fire while
 * every "Hold my seat" silently did not.
 *
 * Delivery is fire-and-forget with a timeout: a hung n8n must never keep a
 * traveller waiting, and a CRM outage must never fail a booking. The trade is
 * that failures are invisible, so every attempt is recorded and surfaced in the
 * admin — otherwise "I think the webhook isn't firing" stays unanswerable.
 */

export function crmWebhookUrl(): string {
  let fromSettings: string | undefined;
  try {
    fromSettings = getSettings().n8nWebhook;
  } catch {
    // reading the catalog must never break a webhook send
  }
  return pickWebhookUrl(process.env.N8N_WEBHOOK_URL, process.env.TW_BOOKING_WEBHOOK, fromSettings);
}

/** fill in the creator's real name from their slug, for the CRM */
export function withCreatorName<T extends { source: { creator: string | null; creatorName: string | null } }>(event: T): T {
  const slug = event.source.creator;
  if (!slug || event.source.creatorName) return event;
  try {
    const c = getCreator(slug);
    if (c) event.source.creatorName = c.name;
  } catch {
    // a catalog read must never break a webhook
  }
  return event;
}

export interface DeliveryRecord {
  at: string;
  event: string;
  eventId: string;
  ok: boolean;
  status: number | null;
  ms: number;
  error: string | null;
  /** where the URL came from, so a misconfiguration is obvious at a glance */
  target: string;
}

/* A ring buffer, not a file: this is diagnostics, not data. It resets on
   deploy, which is fine — the question it answers is "did the last one work?" */
const LOG_MAX = 40;
const log: DeliveryRecord[] = [];

export function deliveryLog(): DeliveryRecord[] {
  return [...log].reverse();
}

function record(r: DeliveryRecord) {
  log.push(r);
  if (log.length > LOG_MAX) log.shift();
}

/** the URL with its credentials and path masked — safe to show in the admin */
function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    const tail = u.pathname.length > 12 ? `${u.pathname.slice(0, 12)}…` : u.pathname;
    return `${u.host}${tail}`;
  } catch {
    return "invalid url";
  }
}

/**
 * Send one event. Never throws, never blocks the caller's response.
 *
 * `await` it only when you actually want the result (the admin's test button);
 * routes should let it run and return immediately.
 */
export async function postToCrm(payload: { event: string; eventId: string }): Promise<DeliveryRecord> {
  const url = crmWebhookUrl();
  const started = Date.now();

  if (!url) {
    const r: DeliveryRecord = {
      at: new Date().toISOString(),
      event: payload.event,
      eventId: payload.eventId,
      ok: false,
      status: null,
      ms: 0,
      error: "no webhook URL configured (env or Admin → Settings)",
      target: "—",
    };
    record(r);
    console.log(`[webhook] ${payload.event} not sent — no URL configured`);
    return r;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const r: DeliveryRecord = {
      at: new Date().toISOString(),
      event: payload.event,
      eventId: payload.eventId,
      ok: res.ok,
      status: res.status,
      ms: Date.now() - started,
      error: res.ok ? null : `HTTP ${res.status}`,
      target: maskUrl(url),
    };
    record(r);
    if (!res.ok) console.error(`[webhook] ${payload.event} → HTTP ${res.status}`);
    return r;
  } catch (e) {
    const r: DeliveryRecord = {
      at: new Date().toISOString(),
      event: payload.event,
      eventId: payload.eventId,
      ok: false,
      status: null,
      ms: Date.now() - started,
      error: e instanceof Error ? e.message : "request failed",
      target: maskUrl(url),
    };
    record(r);
    console.error(`[webhook] ${payload.event} failed:`, r.error);
    return r;
  }
}

/** fire and forget — for request paths, where the visitor must not wait */
export function sendToCrm(payload: { event: string; eventId: string }): void {
  void postToCrm(payload);
}
