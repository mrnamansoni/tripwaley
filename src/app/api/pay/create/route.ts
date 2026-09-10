import { NextRequest, NextResponse } from "next/server";
import { clientIp, publicRateLimit } from "@/lib/auth";
import { getCity, getSettings, holdRates } from "@/lib/catalog";
import { quoteTrip } from "@/lib/pricing";
import { holdQuote, formatPaise } from "@/lib/money";
import { createOrder, newOrderId } from "@/lib/orders";
import { resolveSource, type LeadSource } from "@/lib/webhookPayload";
import { createPayment, phonepeConfigured, PhonePeError } from "@/lib/phonepe";

/**
 * Start a seat-hold payment.
 *
 * The browser sends WHAT is being booked — never how much it costs. This route
 * prices the trip from the catalog, re-applies the coupon itself, computes the
 * 5% + GST hold, writes an order with that figure frozen on it, and only then
 * asks PhonePe for a checkout session. The stored paise figure is the amount
 * that every later confirmation is checked against.
 */

/** absolute origin for PhonePe's redirect back — must be a real public URL */
function origin(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const host = req.headers.get("host") ?? "www.tripwaley.com";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limit = publicRateLimit(ip, "pay", 10);
  if (limit.blocked) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts — please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } }
    );
  }

  if (!phonepeConfigured()) {
    // the UI is supposed to hide the button entirely in this case; if we get
    // here anyway, say so plainly rather than 500ing
    return NextResponse.json(
      { ok: false, error: "Online payment isn't switched on yet — please WhatsApp us to hold your seat." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim().slice(0, 80);
  const phone = String(body.phone ?? "").replace(/[^\d+]/g, "").slice(0, 20);
  const email = String(body.email ?? "").trim().slice(0, 120);
  if (name.length < 2) {
    return NextResponse.json({ ok: false, error: "Please tell us your name." }, { status: 422 });
  }
  if (phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ ok: false, error: "Please enter a valid mobile number." }, { status: 422 });
  }
  /* Required, and checked here as well as in the UI — a browser-side rule is
     decorative, and this is the only address a receipt can be sent to. */
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 422 });
  }

  const priced = quoteTrip({
    packageSlug: String(body.packageSlug ?? ""),
    citySlug: String(body.citySlug ?? ""),
    occupancy: body.occupancy,
    pax: body.pax,
    code: body.couponCode,
  });

  if (!priced.ok) {
    // a bad coupon must not silently become a full-price charge — the visitor
    // asked for a discount, so stop and let them fix or drop the code
    return NextResponse.json(
      { ok: false, error: priced.error, couponRejected: priced.couponRejected ?? false },
      { status: priced.status === 200 ? 422 : priced.status }
    );
  }

  /* Enforced here as well as in the UI. A toggle the browser alone respects is
     decorative — anyone can POST this endpoint directly. */
  if (priced.pkg.bookingEnabled === false) {
    return NextResponse.json(
      { ok: false, error: "Online booking isn't open for this trip — please WhatsApp us to hold a seat." },
      { status: 409 }
    );
  }

  const rates = holdRates();
  const quote = holdQuote({ total: priced.total, ...rates });
  if (!quote.chargeable) {
    return NextResponse.json(
      { ok: false, error: "This trip can't be held online — please WhatsApp us." },
      { status: 409 }
    );
  }

  const citySlug = String(body.citySlug ?? "");
  const city = getCity(citySlug);
  const date = String(body.date ?? "").slice(0, 40);

  /* A departure date is not optional on a PAID order. This route used to accept
     whatever arrived — an empty string when the booking bar had no date to
     offer, or a display label like "12 Jul" from the seat-hold modal — freeze
     it onto the order, and forward it to the CRM as null or as an unparseable
     string. A booking nobody can date is a booking nobody can honour, so it is
     refused here rather than discovered later. */
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { ok: false, error: "Please pick a departure date before paying." },
      { status: 422 }
    );
  }

  const orderId = newOrderId();

  const order = createOrder({
    id: orderId,
    packageSlug: priced.pkg.slug,
    packageName: priced.pkg.name,
    citySlug,
    cityName: city?.name ?? citySlug,
    date,
    occupancy: priced.occupancy,
    pax: priced.pax,
    // pre-coupon, so the CRM's subtotal/discount/total stay consistent
    seatPrice: priced.seat,
    ...(priced.coupon ? { coupon: priced.coupon } : {}),
    // frozen with the order, so a paid booking can still be credited to the
    // creator or campaign that produced it months later
    source: resolveSource(body.source as LeadSource | undefined, req.headers.get("referer")),
    quote,
    contact: { name, phone, email },
  });

  try {
    const payment = await createPayment({
      merchantOrderId: order.id,
      amountPaise: quote.holdTotalPaise,
      redirectUrl: `${origin(req)}/pay/return?order=${encodeURIComponent(order.id)}`,
      message: `${getSettings().brand} — seat hold for ${priced.pkg.name}`,
      // udf1–10 are free text ≤256 chars; these come back on the status call
      // and the webhook, which makes reconciliation possible from either side
      metaInfo: {
        udf1: priced.pkg.slug.slice(0, 256),
        udf2: citySlug.slice(0, 256),
        udf3: date.slice(0, 256),
        udf4: `${priced.pax} pax ${priced.occupancy}`.slice(0, 256),
        udf5: priced.coupon?.code ?? "",
      },
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      redirectUrl: payment.redirectUrl,
      amountPaise: quote.holdTotalPaise,
      amountLabel: formatPaise(quote.holdTotalPaise),
    });
  } catch (e) {
    const msg = e instanceof PhonePeError ? e.message : "Payment could not be started.";
    console.error("[pay/create] failed for", order.id, msg);
    return NextResponse.json(
      { ok: false, orderId: order.id, error: "Couldn't reach the payment gateway. Please try again, or WhatsApp us." },
      { status: 502 }
    );
  }
}
