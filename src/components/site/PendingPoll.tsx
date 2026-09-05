"use client";

import { useEffect, useState } from "react";

/**
 * Keeps the return page honest while a payment is still PENDING.
 *
 * A UPI collect sits pending until the customer approves it in their bank app,
 * which routinely takes a minute or two. Rather than declaring failure on the
 * first look, this asks the server every few seconds and reloads once the
 * verdict changes — the server, not this component, decides what "paid" means.
 *
 * It gives up after two minutes so a genuinely abandoned payment doesn't poll
 * a phone's battery forever; the webhook will still settle the order later.
 */

const EVERY_MS = 4000;
const GIVE_UP_MS = 120_000;

export default function PendingPoll({ orderId }: { orderId: string }) {
  const [elapsed, setElapsed] = useState(0);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();

    const tick = async () => {
      if (cancelled) return;
      const waited = Date.now() - started;
      setElapsed(waited);

      if (waited > GIVE_UP_MS) {
        setStopped(true);
        return;
      }

      try {
        const res = await fetch(`/api/pay/status?order=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && json?.ok && json.status !== "created") {
          // the server has reached a verdict — re-render the page against it
          window.location.reload();
          return;
        }
      } catch {
        // a failed poll is not a failed payment; just try again
      }
      if (!cancelled) timer = setTimeout(tick, EVERY_MS);
    };

    let timer = setTimeout(tick, EVERY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId]);

  if (stopped) {
    return (
      <div className="mt-8 rounded-2xl border border-white/12 bg-white/[0.04] p-5">
        <p className="text-sm leading-relaxed text-white/65">
          Still nothing from your bank. If the money has left your account, it is safe — send us the
          reference below on WhatsApp and we&apos;ll confirm your seat manually.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-4">
      <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-gold" aria-hidden />
      <p className="text-sm text-white/65" role="status" aria-live="polite">
        Checking with the gateway… {Math.floor(elapsed / 1000)}s
      </p>
    </div>
  );
}
