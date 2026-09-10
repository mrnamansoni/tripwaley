import { NextRequest } from "next/server";
import { clientIp, publicRateLimit } from "@/lib/auth";
import { getOrder } from "@/lib/orders";
import { renderInvoice } from "@/lib/renderInvoice";

/**
 * The booking invoice, as a PDF.
 *
 * GET /api/invoice?order=TW-…
 *
 * ONLY for a PAID order. An unpaid one has no invoice — handing someone a
 * document that reads as a receipt for money that never moved is worse than a
 * 404, because they will keep it and quote it back.
 *
 * Access is possession of the order id and nothing more, which is the same
 * protection /pay/return already has: that page renders the customer's phone
 * and email at the same guessable URL today, so this adds no new class of
 * exposure. Rate-limited regardless, so the id space cannot be swept.
 *
 * Node runtime, not edge: the renderer reads font files off disk.
 */

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  const limit = publicRateLimit(ip, "invoice", 20);
  if (limit.blocked) {
    return new Response("Too many requests.", {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfter ?? 30) },
    });
  }

  const id = req.nextUrl.searchParams.get("order") ?? "";
  const order = id ? getOrder(id) : undefined;
  /* One response for "no such order" and "not paid". The difference is not
     something an unauthenticated caller should be able to probe for. */
  if (!order || order.status !== "paid") return new Response("Not found.", { status: 404 });

  const pdf = await renderInvoice(order);

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Tripwaley-Invoice-${order.id}.pdf"`,
      "Content-Length": String(pdf.length),
      // a paid order never changes, but it is still one customer's document
      "Cache-Control": "private, max-age=3600",
    },
  });
}
