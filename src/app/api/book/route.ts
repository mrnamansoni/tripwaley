import { NextRequest, NextResponse } from "next/server";
import { clientIp, publicRateLimit } from "@/lib/auth";
import { crmWebhookUrl } from "@/lib/webhooks";
import { getPackage, getCity, priceFor, getSettings } from "@/lib/catalog";

/**
 * Booking intent capture. Every submit is validated, priced server-side,
 * given an id, and forwarded to the ops webhook (n8n → Twenty CRM).
 * If the webhook is down the client still gets its WhatsApp handoff —
 * no lead is ever silently lost on the visitor's side.
 *
 * The webhook URL comes from lib/webhooks.ts, shared with every other sender.
 *
 * NOTE: nothing on the site calls this route today — the booking bar and the
 * seat-hold modal both post to /api/lead. It is kept because it prices
 * server-side and may be wanted for a server-to-server integration.
 */

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limit = publicRateLimit(ip, "book", 8);
  if (limit.blocked) {
    return NextResponse.json(
      { error: "Too many requests — please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const packageSlug = String(body.packageSlug ?? "");
  const citySlug = String(body.citySlug ?? "");
  const date = String(body.date ?? "");
  const occupancy = String(body.occupancy ?? "triple") as "triple" | "double";
  // guard against non-numeric pax ("abc" → NaN → corrupts the whole quote)
  const paxNum = Number(body.pax);
  const pax = Number.isFinite(paxNum) ? Math.min(20, Math.max(1, Math.round(paxNum))) : 1;
  const name = String(body.name ?? "").slice(0, 80);
  const phone = String(body.phone ?? "").slice(0, 20);

  const pkg = getPackage(packageSlug);
  const city = getCity(citySlug);
  if (!pkg || !city) {
    return NextResponse.json({ ok: false, error: "unknown package or city" }, { status: 400 });
  }

  const rule = priceFor(packageSlug, citySlug);
  const seat = rule?.[occupancy] ?? rule?.triple ?? rule?.double;
  const total = seat != null ? seat * pax : null;
  const settings = getSettings();
  const advance = total != null ? Math.round((total * settings.advancePercent) / 100) : null;

  const bookingId = `TW-${Date.now().toString(36).toUpperCase()}`;
  const payload = {
    event: "booking_intent",
    bookingId,
    createdAt: new Date().toISOString(),
    package: { slug: pkg.slug, code: pkg.code, name: pkg.name },
    fromCity: { slug: city.slug, name: city.name },
    date,
    occupancy,
    pax,
    quote: { seat, total, advancePercent: settings.advancePercent, advance, currency: "INR" },
    contact: { name, phone },
    utm: body.utm ?? null,
    source: "website",
  };

  // fire-and-forget to ops; a CRM hiccup must never block the visitor
  const hook = crmWebhookUrl();
  if (hook) {
    fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    }).catch((e) => console.error("[book] webhook failed:", e?.message));
  } else {
    console.log("[book] lead (no webhook configured):", JSON.stringify(payload));
  }

  return NextResponse.json({ ok: true, bookingId, quote: payload.quote });
}
