import { NextRequest, NextResponse } from "next/server";
import { clientIp, publicRateLimit } from "@/lib/auth";
import { sendToCrm, withCreatorName } from "@/lib/webhooks";
import { buildLeadEvent, resolveSource, type LeadSource } from "@/lib/webhookPayload";
import { getPackage, getCity, priceFor, getSettings } from "@/lib/catalog";

/**
 * Booking intent capture. Every submit is validated, priced server-side,
 * given an id, and forwarded to the ops webhook (n8n → Twenty CRM).
 * If the webhook is down the client still gets its WhatsApp handoff —
 * no lead is ever silently lost on the visitor's side.
 *
 * The webhook URL comes from lib/webhooks.ts, shared with every other sender,
 * and so does the payload SHAPE — this route used to post a flat
 * `booking_intent` object of its own to the same URL, which no single n8n
 * mapping could read alongside the structured events every other sender emits.
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

  sendToCrm(
    withCreatorName(buildLeadEvent({
      id: bookingId,
      name,
      phone,
      packageSlug: pkg.slug,
      packageName: pkg.name,
      packageCode: pkg.code,
      destination: pkg.destination,
      nights: pkg.nights ?? null,
      date,
      citySlug: city.slug,
      cityName: city.name,
      occupancy,
      pax,
      seatPrice: seat ?? null,
      source: resolveSource(body.source as LeadSource | undefined, req.headers.get("referer")),
    }))
  );

  return NextResponse.json({
    ok: true,
    bookingId,
    quote: { seat, total, advancePercent: settings.advancePercent, advance, currency: "INR" },
  });
}
