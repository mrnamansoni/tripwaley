import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/auth";
import { crmWebhookUrl, deliveryLog, postToCrm } from "@/lib/webhooks";
import { buildLeadEvent } from "@/lib/webhookPayload";

/**
 * Webhook diagnostics for the admin panel.
 *
 * "I think the webhook isn't firing" was unanswerable before this: delivery is
 * fire-and-forget, so a failure left no trace anywhere. GET reports whether a
 * URL is configured, WHERE that URL came from, and the recent delivery
 * attempts. POST sends a real, clearly-marked test event and returns what n8n
 * actually replied.
 *
 * Under /api/admin, so proxy.ts has already required an admin session.
 */

export async function GET() {
  const url = crmWebhookUrl();
  let host = "";
  try {
    host = url ? new URL(url).host : "";
  } catch {
    host = "invalid url";
  }

  return NextResponse.json({
    configured: Boolean(url),
    // host only — a webhook path routinely carries a secret token
    host,
    source: process.env.N8N_WEBHOOK_URL
      ? "N8N_WEBHOOK_URL (environment)"
      : process.env.TW_BOOKING_WEBHOOK
        ? "TW_BOOKING_WEBHOOK (environment)"
        : url
          ? "Admin → Settings"
          : "not configured anywhere",
    log: deliveryLog(),
  });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  /* A real event through the real sender. A test that took a different code
     path would prove nothing about the path that actually matters. */
  const event = buildLeadEvent({
    id: `test-${Date.now().toString(36)}`,
    name: "Webhook Test",
    phone: "9999999999",
    packageSlug: "test-trip",
    packageName: "Webhook test — safe to ignore",
    packageCode: "TEST",
    destination: "Test",
    nights: 0,
    date: "",
    citySlug: "delhi",
    cityName: "Delhi",
    occupancy: "triple",
    pax: 1,
    seatPrice: null,
    source: { page: "/admin", surface: "admin-test" },
  });

  const result = await postToCrm({ ...event, event: "test.ping" });
  return NextResponse.json({ ok: result.ok, result });
}
