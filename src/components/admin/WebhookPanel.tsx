"use client";

/* WEBHOOK HEALTH.
 *
 * Delivery to n8n is fire-and-forget — a traveller must never wait on a CRM,
 * and a CRM outage must never fail a booking. The cost of that is silence:
 * "I think the webhook isn't firing" had no way to be answered. This panel
 * answers it — where the URL comes from, what the last attempts did, and a
 * button that sends a real event through the real sender. */

import { useEffect, useState } from "react";
import { Btn, label } from "./ui";

interface Delivery {
  at: string; event: string; eventId: string;
  ok: boolean; status: number | null; ms: number; error: string | null; target: string;
}
interface Health { configured: boolean; host: string; source: string; log: Delivery[] }

export default function WebhookPanel() {
  const [h, setH] = useState<Health | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/webhook", { cache: "no-store" });
        const j = await r.json();
        if (!dead) setH(j);
      } catch {
        if (!dead) setMsg({ ok: false, text: "Couldn't read webhook status." });
      }
    })();
    return () => { dead = true; };
  }, [reload]);

  const test = async () => {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/admin/webhook", { method: "POST" });
      const j = await r.json();
      setMsg(
        j.ok
          ? { ok: true, text: `Delivered — n8n replied HTTP ${j.result.status} in ${j.result.ms}ms.` }
          : { ok: false, text: j.result?.error ?? "Delivery failed." }
      );
      setReload((n) => n + 1);
    } catch {
      setMsg({ ok: false, text: "Couldn't run the test." });
    } finally { setBusy(false); }
  };

  if (!h) return null;

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={label}>CRM webhook</p>
          <p className="mt-1 text-sm text-white/55">
            {h.configured ? (
              <>
                Sending to <span className="font-mono text-white/80">{h.host}</span>
                <span className="text-white/35"> · from {h.source}</span>
              </>
            ) : (
              <span className="font-bold text-gold">
                No URL set — leads are saved below but never reach your CRM.
              </span>
            )}
          </p>
        </div>
        <Btn onClick={test} disabled={busy}>{busy ? "sending…" : "Send test event"}</Btn>
      </div>

      {msg && (
        <p className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${msg.ok ? "bg-success/15 text-success" : "bg-brand/15 text-brand-bright"}`}>
          {msg.text}
        </p>
      )}

      {h.log.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-white/40">
            recent deliveries (resets on deploy)
          </p>
          <ul className="mt-2 space-y-1">
            {h.log.slice(0, 8).map((d) => (
              <li key={d.eventId + d.at} className="flex items-baseline gap-3 font-mono text-[0.68rem]">
                <span className={d.ok ? "text-success" : "text-brand-bright"}>{d.ok ? "✓" : "✗"}</span>
                <span className="text-white/40">{d.at.slice(11, 19)}</span>
                <span className="text-white/70">{d.event}</span>
                <span className="text-white/35">
                  {d.ok ? `HTTP ${d.status} · ${d.ms}ms` : d.error}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
