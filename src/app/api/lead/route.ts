/**
 * Public lead capture — every "Hold my seat" fires here before WhatsApp opens,
 * so no intent is ever lost. PHONE IS REQUIRED (that's the lead).
 *
 * Appends to the bookings log and forwards a structured event to the CRM.
 * The webhook URL is resolved by lib/webhooks.ts, which reads the environment
 * AND the admin setting — this route used to read N8N_WEBHOOK_URL alone, so a
 * URL configured in Admin → Settings meant leads silently never reached n8n.
 */

import { NextRequest, NextResponse } from "next/server";
import { clientIp, publicRateLimit } from "@/lib/auth";
import { appendBooking } from "@/lib/store";
import { getCity, getPackage, priceFor } from "@/lib/catalog";
import { quoteTrip } from "@/lib/pricing";
import { buildLeadEvent, resolveSource, type LeadSource } from "@/lib/webhookPayload";
import { sendToCrm, withCreatorName } from "@/lib/webhooks";

/** accept Indian mobiles: 10 digits starting 6–9, optional +91 / 0 prefix */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limit = publicRateLimit(ip, "lead", 8);
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
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const str = (v: unknown, max = 80) => (typeof v === "string" ? v.slice(0, max) : "");

  const phone = normalizePhone(str(body.phone, 20));
  if (!phone) return NextResponse.json({ error: "a valid mobile number is required" }, { status: 422 });

  // the browser says where it came from; the Referer header is the second
  // witness. resolveSource() decides between them.
  const src = resolveSource(body.source as LeadSource | undefined, req.headers.get("referer"));

  const packageSlug = str(body.package);
  const citySlug = str(body.city, 40);
  const paxRaw = Number(body.pax);
  const pax = Number.isFinite(paxRaw) ? Math.min(20, Math.max(1, Math.round(paxRaw))) : 1;

  const row = appendBooking({
    name: str(body.name, 60),
    phone,
    package: packageSlug,
    city: citySlug,
    date: str(body.date, 10),
    occupancy: str(body.occupancy, 10),
    price: typeof body.price === "number" && Number.isFinite(body.price) ? body.price : null,
    source: src.surface,
    sourcePage: src.page,
    ...(src.creator ? { creator: src.creator } : {}),
    pax,
  });

  /* Enrich from the catalog rather than trusting the browser: the CRM wants the
     trip's real name, code and seat price, and those must not be whatever a
     request body happened to claim. */
  const pkg = packageSlug ? getPackage(packageSlug) : undefined;
  const city = citySlug ? getCity(citySlug) : undefined;
  const occ = row.occupancy === "double" ? "double" : "triple";

  /* Price the coupon HERE, the same way /api/pay/create does. The lead event
     used to carry no coupon at all — someone who applied a code and took the
     WhatsApp route reached the CRM as a full-price lead, contradicting the
     discounted figure sitting on the same row in Admin → Bookings, and losing
     any record of which code they used. The discount is re-derived rather than
     read from the request, because a browser-supplied discount is not a fact. */
  const priced = packageSlug && citySlug
    ? quoteTrip({ packageSlug, citySlug, occupancy: occ, pax, code: str(body.couponCode, 40) })
    : undefined;

  const rule = packageSlug && citySlug ? priceFor(packageSlug, citySlug) : undefined;
  // an invalid/expired code must not cost us the lead — fall back to list price
  const seat = priced?.ok ? priced.seat : rule?.[occ] ?? rule?.triple ?? rule?.double ?? null;
  const coupon = priced?.ok ? priced.coupon ?? null : null;

  sendToCrm(
    withCreatorName(buildLeadEvent({
      id: row.id,
      name: row.name,
      phone: row.phone,
      packageSlug: pkg?.slug ?? packageSlug,
      packageName: pkg?.name ?? "",
      packageCode: pkg?.code ?? "",
      destination: pkg?.destination ?? "",
      nights: pkg?.nights ?? null,
      date: row.date,
      citySlug: city?.slug ?? citySlug,
      cityName: city?.name ?? citySlug,
      occupancy: row.occupancy,
      pax,
      seatPrice: seat,
      coupon,
      source: src,
    }))
  );

  return NextResponse.json({ ok: true, id: row.id });
}
