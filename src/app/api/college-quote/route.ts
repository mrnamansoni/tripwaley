/**
 * College trip quote request.
 *
 * Same contract as /api/lead — the row lands in the bookings log so it shows
 * up in the admin Bookings tab alongside every other enquiry — but the extra
 * college fields (batch size, budget per student) are carried through to the
 * ops webhook, where the quote actually gets built.
 *
 * PHONE IS REQUIRED: it's the only field that makes this a usable lead.
 *
 * env: N8N_WEBHOOK_URL — shared with /api/lead so both feed the same CRM.
 */

import { NextResponse } from "next/server";
import { appendBooking } from "@/lib/store";
import { getSettings } from "@/lib/catalog";

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

export async function POST(req: Request) {
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

  const payload = {
    event: "college_quote",
    ...row,
    college,
    contactName: name,
    email,
    destination,
    students,
    budgetPerStudent: budget,
    month,
    notes,
  };

  const hook = process.env.N8N_WEBHOOK_URL || getSettings().n8nWebhook;
  if (hook) {
    // fire-and-forget: a slow CRM must never hold up the student's form
    fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    }).catch((e) => console.error("[college-quote] webhook failed:", e?.message));
  } else {
    console.log("[college-quote] lead (no webhook configured):", JSON.stringify(payload));
  }

  return NextResponse.json({ ok: true, id: row.id });
}
