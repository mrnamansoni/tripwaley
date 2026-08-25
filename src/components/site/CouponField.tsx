"use client";

/* COUPON — the code box in the booking flow.
 *
 * This component never does the maths. It sends the trip identifiers to
 * /api/coupon and renders whatever the server says, because the discount has
 * to be decided somewhere the traveller can't edit. Whatever it reports back
 * up is display state; the payment path re-validates the code before charging.
 */

import { useState } from "react";

export interface AppliedCoupon {
  code: string;
  label: string;
  discount: number;
  total: number;
}

export default function CouponField({
  packageSlug,
  citySlug,
  occupancy,
  pax = 1,
  disabled,
  applied,
  onApply,
  onClear,
}: {
  packageSlug: string;
  citySlug: string;
  occupancy: "triple" | "double";
  pax?: number;
  disabled?: boolean;
  applied: AppliedCoupon | null;
  onApply: (c: AppliedCoupon) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function check() {
    const c = code.trim();
    if (!c) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/coupon", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: c, packageSlug, citySlug, occupancy, pax }),
      });
      const j = await res.json();
      if (!j.ok) {
        setErr(j.error || "That code didn't work.");
        return;
      }
      onApply({ code: j.code, label: j.label, discount: j.discount, total: j.total });
      setCode("");
    } catch {
      setErr("Couldn't check that code — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (applied) {
    return (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-success/40 bg-success/10 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-[0.62rem] font-bold uppercase tracking-[0.18em] text-success">
            {applied.code} applied
          </p>
          <p className="mt-0.5 text-[0.8rem] text-white/70">
            {applied.label} — you save ₹{applied.discount.toLocaleString("en-IN")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 text-[0.62rem] font-bold uppercase tracking-wider text-white/45 underline-offset-2 hover:text-white hover:underline"
        >
          remove
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-gold underline-offset-4 hover:underline disabled:opacity-40"
      >
        + Have a coupon code?
      </button>
    );
  }

  return (
    <div className="mt-4">
      <label className="block text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45" htmlFor="coupon-code">
        coupon code
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="coupon-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setErr("");
          }}
          onKeyDown={(e) => e.key === "Enter" && check()}
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="e.g. FIRSTTRIP"
          className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 font-mono text-base uppercase tracking-wider text-white outline-none transition-colors focus:border-gold"
        />
        <button
          type="button"
          onClick={check}
          disabled={busy || !code.trim()}
          className="shrink-0 rounded-xl border border-gold px-5 text-sm font-extrabold text-gold transition-colors hover:bg-gold hover:text-ink disabled:opacity-40"
        >
          {busy ? "…" : "Apply"}
        </button>
      </div>
      {err && <p className="mt-2 text-sm font-semibold text-brand-bright">{err}</p>}
    </div>
  );
}
