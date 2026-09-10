"use client";

/* PAYMENTS — every attempt to hold a seat online.
 *
 * Read-only by design. Money that has moved is a record, not a form: the only
 * write here is "ask PhonePe again", for an order left pending because the
 * customer closed the tab mid-UPI. Everything else is what the gateway said. */

import { useEffect, useState } from "react";
import { Head, Btn } from "./ui";
import { formatPaise } from "@/lib/money";
import GatewaySettings from "./GatewaySettings";
import type { Order, OrderStatus } from "@/lib/orders";

const PILL: Record<OrderStatus, string> = {
  paid: "bg-success/15 text-success border-success/30",
  created: "bg-gold/15 text-gold border-gold/30",
  failed: "bg-brand/15 text-brand-bright border-brand/30",
  expired: "bg-white/8 text-white/45 border-white/15",
};

const LABEL: Record<OrderStatus, string> = {
  paid: "paid",
  created: "pending",
  failed: "failed",
  expired: "expired",
};

export default function PaymentsView() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [gateway, setGateway] = useState<{ configured: boolean; env: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  /* bumped to re-fetch after a re-check; the load lives inside the effect so
     state only ever lands in the async continuation, never in the effect body */
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/orders", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        setOrders(json.orders ?? []);
        setGateway(json.gateway ?? null);
      } catch {
        if (!cancelled) setError("Couldn't load payments.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const recheck = async (id: string) => {
    setBusy(id);
    setError("");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "check failed");
      setReloadKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status check failed.");
    } finally {
      setBusy(null);
    }
  };

  const paid = (orders ?? []).filter((o) => o.status === "paid");
  const collected = paid.reduce((sum, o) => sum + o.quote.holdTotalPaise, 0);
  const stillDue = paid.reduce((sum, o) => sum + o.quote.advanceBalancePaise, 0);

  return (
    <>
      <Head
        title="Payments"
        sub="Seat holds paid through PhonePe. The amount charged is always priced by the server, never by the browser."
      />

      <GatewaySettings onSaved={() => setReloadKey((k) => k + 1)} />

      {gateway?.configured && gateway.env === "sandbox" && (
        <p className="mb-5 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/60">
          Running against PhonePe&apos;s <strong className="text-white">sandbox</strong> — these are test
          payments, and no real money moves. Switch the environment to production above when you go live.
        </p>
      )}

      {paid.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Stat label="seats held" value={String(paid.length)} />
          <Stat label="collected online" value={formatPaise(collected)} />
          <Stat label="advance still to collect" value={formatPaise(stillDue)} tone="gold" />
        </div>
      )}

      {error && <p className="mb-4 text-sm font-semibold text-brand-bright">{error}</p>}

      <div data-lenis-prevent className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[62rem] text-left text-sm">
          <thead className="bg-black/40 text-[0.58rem] font-bold uppercase tracking-widest text-white/45">
            <tr>
              {["when", "status", "paid", "still due", "trip", "traveller", "reference", ""].map((h) => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="border-t border-white/8 align-top text-white/75">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                  {o.createdAt.slice(0, 16).replace("T", " ")}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wider ${PILL[o.status]}`}>
                    {LABEL[o.status]}
                  </span>
                  {o.phonepe?.state === "AMOUNT_MISMATCH" && (
                    <p className="mt-1 text-[0.65rem] font-bold text-brand-bright">amount mismatch — check manually</p>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-white">
                  {formatPaise(o.quote.holdTotalPaise)}
                  <span className="block font-mono text-[0.6rem] font-normal text-white/35">
                    {formatPaise(o.quote.holdBasePaise)}
                    {o.quote.holdGstPaise > 0 && ` + ${formatPaise(o.quote.holdGstPaise)} gst`}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gold">
                  {o.status === "paid" ? formatPaise(o.quote.advanceBalancePaise) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold text-white">{o.packageName}</span>
                  <span className="block text-[0.7rem] text-white/45">
                    ex-{o.cityName} · {o.date || "next batch"} · {o.pax} pax {o.occupancy}
                    {o.coupon && ` · ${o.coupon.code}`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {o.contact.name || "—"}
                  {o.contact.phone && (
                    <span className="mt-0.5 flex items-center gap-2">
                      <a href={`tel:${o.contact.phone}`} className="font-mono text-xs font-bold text-white hover:text-gold">
                        {o.contact.phone}
                      </a>
                      <a
                        href={`https://wa.me/${o.contact.phone.replace(/\D/g, "").slice(-10).padStart(12, "91")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-success hover:text-white"
                        title="WhatsApp"
                      >
                        ✆
                      </a>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-[0.65rem] text-white/50">
                  {o.id}
                  {o.phonepe?.paymentMode && <span className="block text-white/35">{o.phonepe.paymentMode}</span>}
                </td>
                <td className="px-4 py-3">
                  {o.status === "created" && (
                    <Btn onClick={() => recheck(o.id)} disabled={busy === o.id}>
                      {busy === o.id ? "checking…" : "re-check"}
                    </Btn>
                  )}
                  {/* only a paid order has an invoice — the route refuses the
                      rest, so offering the link would be a dead end */}
                  {o.status === "paid" && (
                    <a
                      href={`/api/invoice?order=${encodeURIComponent(o.id)}`}
                      className="inline-flex rounded-full border border-white/20 px-3 py-1.5 text-[0.65rem] font-bold text-white transition-colors hover:border-gold hover:text-gold"
                    >
                      invoice ↓
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {orders !== null && orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-white/35">
                  No payments yet — they appear here the moment someone pays to hold a seat.
                </td>
              </tr>
            )}
            {orders === null && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-white/35">Loading…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "gold" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className={`mt-1 font-display text-2xl font-extrabold ${tone === "gold" ? "text-gold" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
