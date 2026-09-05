import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/auth";
import { listOrders } from "@/lib/orders";
import { refreshFromPhonePe } from "@/lib/settle";
import { phonepeConfigured, phonepeEnv } from "@/lib/phonepe";

/**
 * Payment orders for the admin panel.
 *
 * Deliberately NOT folded into /api/admin/catalog. That endpoint hands the
 * whole catalog to the browser and takes it back on save; orders must never
 * travel on a payload that gets written back, or an admin's Save could rewrite
 * payment history. Read-only here, with one narrow write: re-asking PhonePe
 * about a single order.
 *
 * The route sits under /api/admin, so the session guard in proxy.ts already
 * requires a logged-in admin before this file runs.
 */

export async function GET() {
  return NextResponse.json({
    orders: listOrders(),
    gateway: { configured: phonepeConfigured(), env: phonepeEnv() },
  });
}

/** Re-check one order against PhonePe — for anything stuck on pending. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const settled = await refreshFromPhonePe(id);
    if (!settled) return NextResponse.json({ error: "unknown order" }, { status: 404 });
    return NextResponse.json({ ok: true, order: settled.order });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "status check failed" },
      { status: 502 }
    );
  }
}
