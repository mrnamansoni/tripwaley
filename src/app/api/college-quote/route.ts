/**
 * College trip quote request.
 *
 * Same contract as /api/lead — the row lands in the bookings log so it shows
 * up in the admin Bookings tab alongside every other enquiry — but the extra
 * college fields (batch size, budget per student) ride in the event's `college`
 * block, where the quote actually gets built.
 *
 * PHONE IS REQUIRED: it's the only field that makes this a usable lead.
 *
 * This used to POST a flat, college-shaped payload of its own to the SAME
 * webhook URL as every other event. One n8n mapping could not read both, so a
 * college enquiry errored the workflow and the lead never reached the CRM. It
 * now sends the shared envelope through the shared sender, which also means
 * these deliveries show up in Admin → Bookings like everything else.
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
  const limit = publicRateLimit(ip, "college", 5);
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

  const college = str(body.college, 90);
  if (!college) {
    return NextResponse.json({ error: "college name is required" }, { status: 422 });
  }

  const students = num(body.students, 1, 2000);
  const budget = num(body.budget, 0, 500000);
  const name = str(body.name, 60);
  const email = str(body.email, 90);
  const destination = str(body.destination, 90);
  const month = str(body.month, 30);
  const notes = str(body.notes, 600);

  // The lead row keeps the shared shape so the admin Bookings table and the
  // dashboard counter work unchanged; the college specifics ride in `city`
  // and `occupancy`, which are free-text there.
  const row = appendBooking({
    name: name || college,
    phone,
    package: destination ? `College · ${destination}` : "College trip enquiry",
    city: college,
    date: month,
    occupancy: students ? `${students} students` : "",
    price: budget,
    source: "college-quote",
  });

  /* The surface is asserted by the server — this route IS the college form, and
     that is not something a request body gets a say in. Anything else the
     browser knows (UTMs, the page) still travels. */
  const client = (body.source as LeadSource | undefined) ?? {};
  const src = resolveSource(
    { ...client, surface: "college-quote", page: client.page || "/college-trips" },
    req.headers.get("referer")
  );

  sendToCrm(
    buildLeadEvent({
      id: row.id,
      name: name || college,
      phone,
      email,
      // there is no package yet — that is the whole point of the enquiry
      packageName: destination ? `College trip — ${destination}` : "College trip enquiry",
      destination,
      pax: students ?? undefined,
      // a per-student budget is the closest thing this form has to a seat price
      seatPrice: budget,
      source: src,
      college: {
        institution: college,
        students,
        budgetPerStudent: budget,
        month,
        notes,
      },
    })
  );

  return NextResponse.json({ ok: true, id: row.id });
}
