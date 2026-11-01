/**
 * Corporate trip enquiry.
 *
 * Same contract as /api/college-quote: the row lands in the bookings log (so
 * it shows in Admin → Bookings) and the event goes out through the shared CRM
 * envelope. There is deliberately NO corporate-specific block on the event —
 * the n8n mapping reads one shape, and everything a corporate brief needs fits
 * the existing fields (company rides in `packageName`, headcount in `pax`,
 * per-head budget in `seatPrice`). Rough dates and the free-text brief stay
 * on the Bookings row, where the team reads them before calling back.
 *
 * PHONE AND COMPANY ARE REQUIRED: without both there is nobody to call back.
 */

import { NextRequest, NextResponse } from "next/server";
import { sendToCrm } from "@/lib/webhooks";
import { buildLeadEvent, resolveSource, type LeadSource } from "@/lib/webhookPayload";
import { clientIp, publicRateLimit } from "@/lib/auth";
import { appendBooking } from "@/lib/store";

/** accept Indian mobiles: 10 digits starting 6–9, optional +91 / 0 prefix */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

const str = (v: unknown, max = 80) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** clamp a numeric field, returning null rather than NaN for junk input */
function num(v: unknown, min: number, max: number): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limit = publicRateLimit(ip, "corporate", 5);
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

  const phone = normalizePhone(str(body.phone, 20));
  if (!phone) {
    return NextResponse.json({ error: "a valid 10-digit mobile number is required" }, { status: 422 });
  }

  const company = str(body.company, 90);
  if (!company) {
    return NextResponse.json({ error: "company name is required" }, { status: 422 });
  }

  const people = num(body.people, 1, 5000);
  const budget = num(body.budget, 0, 1000000);
  const name = str(body.name, 60);
  const email = str(body.email, 90);
  const format = str(body.format, 40);
  const destination = str(body.destination, 90);
  const month = str(body.month, 30);
  const notes = str(body.notes, 600);

  // free-text columns in the Bookings table carry the corporate specifics,
  // the same way the college form uses them
  const row = appendBooking({
    name: name || company,
    phone,
    package: `Corporate · ${format || "enquiry"}${destination ? ` · ${destination}` : ""}`,
    city: company,
    date: month,
    occupancy: people ? `${people} people` : "",
    price: budget,
    source: "corporate-quote",
    ...(notes ? { notes } : {}),
  });

  // the surface is asserted by the server — this route IS the corporate form
  const client = (body.source as LeadSource | undefined) ?? {};
  const src = resolveSource(
    { ...client, surface: "corporate-quote", page: client.page || "/corporate-trips" },
    req.headers.get("referer")
  );

  sendToCrm(
    buildLeadEvent({
      id: row.id,
      name: name || company,
      phone,
      email,
      packageName: `Corporate ${format ? format.toLowerCase() : "trip"} — ${company}`,
      destination,
      // no `date`: the event expects an ISO departure date, and "rough dates"
      // here is free text — it stays on the Bookings row instead
      pax: people ?? undefined,
      seatPrice: budget,
      source: src,
    })
  );

  return NextResponse.json({ ok: true, id: row.id });
}
