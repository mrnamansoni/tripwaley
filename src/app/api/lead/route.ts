/**
 * Public lead capture — every "hold my seat" fires here before WhatsApp
 * opens, so no intent is ever lost. PHONE IS REQUIRED (that's the lead).
 * Appends to the bookings log and forwards to n8n when N8N_WEBHOOK_URL is
 * set (CRM push happens there). Validated + capped here.
 */

import { NextResponse } from "next/server";
import { appendBooking } from "@/lib/store";

/** accept Indian mobiles: 10 digits starting 6–9, optional +91 / 0 prefix */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const str = (v: unknown, max = 80) => (typeof v === "string" ? v.slice(0, max) : "");

  const phone = normalizePhone(str(body.phone, 20));
  if (!phone) return NextResponse.json({ error: "a valid mobile number is required" }, { status: 422 });

  const row = appendBooking({
    name: str(body.name, 60),
    phone,
    package: str(body.package),
    city: str(body.city, 40),
    date: str(body.date, 10),
    occupancy: str(body.occupancy, 10),
    price: typeof body.price === "number" && Number.isFinite(body.price) ? body.price : null,
    source: str(body.source, 30) || "site",
  });

  const hook = process.env.N8N_WEBHOOK_URL;
  if (hook) {
    fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "seat_hold", ...row }),
      signal: AbortSignal.timeout(6000), // don't let a hung n8n pile up open sockets
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: row.id });
}
